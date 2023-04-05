import IController from "./controller";
import express, { Request, Response } from "express";
import { authBearer } from "../middlewares/auth";
import { checkPermAPI } from "../middlewares/checkPerms";
import User from "../models/user";
import * as bcrypt from "bcrypt";
import { body, validationResult } from 'express-validator';
import { checkMailTransporter, sendCreationEmail, sendPasswordForgottenMail } from "../mails";
import Card from "../models/card";
import Part from "../models/part";
import Sprint from "../models/sprint";
import PollingController from "./pollingController";

class UserController implements IController {
    public path = "/users";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/list", authBearer, checkPermAPI("MAINTENER"), this.listUsers);
        this.router.get("/cardsStats", authBearer, checkPermAPI("MAINTENER"), this.cardsStats);
        this.router.get("/:id", authBearer, this.getOne);
        this.router.post("/create", authBearer, checkPermAPI("EDITOR"), this.createUser);
        this.router.post("/createDefault", this.createDefaultUser);
        this.router.post("/edit", authBearer, this.editUser);
        this.router.post("/forgotPassword", this.forgotPassword);
    }

    private listUsers = async (req: Request, res: Response) => {
        let allUsers = await User.findAll({
            include: [
                Card
            ]
        });

        if (req.user.role == "ADMIN" || req.user.role == "EDITOR") {
            allUsers.forEach((x) => {
                const resultObject = x.toJSON() as User & {totalCards: number, totalWorkDays: number};
                resultObject.totalCards = 0;
                resultObject.totalWorkDays = 0;
                x.cards.forEach((x: Card) => {
                    if (x.status != "REJECTED" && x.status != "WAITING_APPROVAL") {
                        resultObject.totalCards++;
                        resultObject.totalWorkDays += x.workingDays;
                    }
                })
                delete resultObject.cards;
            });
        } else {
            allUsers = allUsers.map(x => {x = x.toJSON(); delete x.cards; return x;});
        }

        return res.status(200).send(allUsers);
    }

    private getOne = async (req: Request, res: Response) => {
        const user = await User.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!user) {
            return res.status(400).send({
                message: "Invalid user id"
            });
        }
        return res.status(200).send(user);
    }

    private createUser = [
        body("firstname").exists({ checkFalsy: true }),
        body("lastname").exists({ checkFalsy: true }),
        body("email").normalizeEmail().isEmail(),
        body("role").isIn(["ADMIN", "EDITOR", "MAINTENER", "USER"]),
        async (req: Request, res: Response) => {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).send({
                    message: "Invalid body."
                });
            }
            if (await User.isEmailAlreadyUsed(req.body.email)) {
                return res.status(400).send({
                    message: "Email already in use."
                });
            }
            if (req.body.role == "ADMIN" && req.user.role != "ADMIN") {
                return res.status(403).send({
                    message: "You don't have the permission to perform this action."
                })
            }
            const created = User.build({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                role: req.body.role
            })
            if (checkMailTransporter()) {
                const password = User.generateRandomPassword();
                created.password = await bcrypt.hash(password, 10);
                sendCreationEmail(created, req.user, password);
            } else {
                if (!req.wap.config.Default_Password.value) {
                    return res.status(400).send({
                        message: "Default password is not set in the config."
                    });
                }
                created.password = await bcrypt.hash(req.wap.config.Default_Password.value, 10);
            }
            await created.save();
            PollingController.addToPollList('useListUsersQuery');
            PollingController.addToPollList('useUserInfosQuery');
            return res.status(200).send({
                message: "User created."
            });
        }
    ]

    private editUser = [
        body("role").isIn(["ADMIN", "EDITOR", "MAINTENER", "USER"]).optional(),
        async (req: Request, res: Response) => {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).send({
                    message: "Invalid body."
                });
            }
            if (!req.body.id) {
                return res.status(400).send({
                    message: "Missing id"
                });
            }
            const user = await User.findOne({
                where: {
                    id: req.body.id
                }
            })
            if (!user) {
                return res.status(400).send({
                    message: "Invalid id"
                });
            }
            if (req.body.email && req.body.email != user.email) {
                const count_mail = await User.count({
                    where: {
                        email: req.body.email
                    }
                })
                if (count_mail != 0) {
                    return res.status(400).send({
                        message: "Email already in use."
                    })
                }
            }
            if (req.user.role != "ADMIN" && req.user.role != "EDITOR") {
                if (req.user.id != user.id) {
                    return res.status(403).send({
                        message: "You don't have the permission to perform this action."
                    });
                }
                if (req.body.password) {
                    if (req.body.password.length < 4) {
                        return res.status(400).send({
                            message: "Password must be at least 4 characters long."
                        });
                    }
                    user.isDefaultPassword = false;
                    user.password = await bcrypt.hash(req.body.password, 10);
                    await user.save();
                }
                return res.status(200).send({
                    message: "Success."
                });
            }
            if (req.user.role == "EDITOR" && user.role == "ADMIN") {
                return res.status(403).send({
                    message: "You don't have the permission to perform this action."
                });
            }
            if (req.body.role) {
                if (req.user.role == "EDITOR" && req.body.role == "ADMIN") {
                    return res.status(403).send({
                        message: "You don't have the permission to upgrade your role."
                    })
                }
            }
            if (req.body.password) {
                if (req.body.password.length < 4) {
                    return res.status(400).send({
                        message: "Password must be at least 4 characters long."
                    });
                }
                user.isDefaultPassword = false;
                user.password = await bcrypt.hash(req.body.password, 10);
            }
            user.set({
                firstname: req.body.firstname ?? user.firstname,
                lastname: req.body.lastname ?? user.lastname,
                email: req.body.email ?? user.email,
                role: req.body.role ?? user.role
            });
            await user.save();
            PollingController.addToPollList('useListUsersQuery');
            PollingController.addToPollList('useUserInfosQuery');
            return res.status(200).send({
                message: "Success."
            });
        }
    ]

    private createDefaultUser = [
        body("email").normalizeEmail().isEmail(),
        body("firstname").exists({ checkFalsy: true }),
        body("lastname").exists({ checkFalsy: true }),
        body("password").exists({ checkFalsy: true }),
        async (req: Request, res: Response) =>  {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).send({
                    message: "Invalid body."
                });
            }
            if ((await User.count() == 0)) {
                return res.status(403).send({
                    message: "You can't acces this route."
                })
            }
            const user = await User.create({
                email: req.body.email,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                password: await bcrypt.hash(req.body.password, 10),
                role: "ADMIN"
            })
            return res.status(200).send({
                message: "Defautl account successfully created."
            })
        }
    ]

    private forgotPassword = [
        body("email").normalizeEmail().isEmail(),
        async (req: Request, res: Response) => {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).send({
                    message: "Invalid email"
                });
            }
            const user = await User.findOne({
                where: {
                    email: req.body.email
                }
            });
            if (!user) {
                return res.status(400).send({
                    message: "Invalid email"
                });
            }
            if (!checkMailTransporter()) {
                return res.status(409).send({
                    message: "Mail sending is not supported on this WAP instance. Please contact your WAP administrator."
                })
            }
            const password = User.generateRandomPassword();
            user.password = await bcrypt.hash(password, 10);
            user.isDefaultPassword = true;
            await user.save();
            await sendPasswordForgottenMail(user, password);
            PollingController.addToPollList('useListUsersQuery');
            PollingController.addToPollList('useUserInfosQuery');
            return res.status(200).send({
                message: "Success."
            });
        }
    ]

    private cardsStats = async (req: Request, res: Response) => {
        let allUsers = await User.findAll({
            order: [['firstname', 'ASC'], ['lastname', 'ASC']],
            include: [
                {
                    model: Card,
                    include: [
                        Part,
                        Sprint,
                        User
                    ],
                }
            ]
        });
        if (req.query.userId) {
            const user = await User.findOne({
                where: {
                    id: req.query.userId as any
                }
            });
            if (!user) {
                return res.status(400).send({
                    message: "Invalid user id"
                });
            }
            allUsers = allUsers.filter(u => u.id == user.id);
        }
        if (req.query.sprintId) {
            const sprint = await Sprint.findOne({
                where: {
                    id: req.query.sprintId as any
                }
            })
            if (!sprint) {
                return res.status(400).send({
                    message: "Invalid sprint id"
                });
            }
            allUsers.forEach(user => {
                user.cards = user.cards.filter(card => card.sprintId == sprint.id)
            })
        }
        allUsers = allUsers.map(user => {
            const toRet = user.toJSON() as (User & {
                JHIntended: number, 
                JHDones: number,
                JHInProgress: number,
                JHNotStarted: number,
                JHRejected: number,
                JHWaitingApproval: number,
                JHMissing: number,
            });
            toRet.JHIntended = 0;
            toRet.JHDones = 0;
            toRet.JHInProgress = 0;
            toRet.JHNotStarted = 0;
            toRet.JHRejected = 0;
            toRet.JHWaitingApproval = 0;
            toRet.JHMissing = 0;
            user.cards.forEach(card => {
                const toAdd = (card.workingDays / card.assignees.length);
                switch (card.status) {
                    case "REJECTED":
                        toRet.JHRejected += toAdd; break;
                    case "WAITING_APPROVAL":
                        toRet.JHWaitingApproval += toAdd; break;
                    case "NOT_STARTED":
                        toRet.JHNotStarted += toAdd; break;
                    case "STARTED":
                        toRet.JHInProgress += toAdd; break;
                    case "FINISHED":
                        toRet.JHDones += toAdd; break;
                }
                if (card.status != "REJECTED" && card.status != "WAITING_APPROVAL") {
                    toRet.JHIntended += toAdd;
                }
            })
            toRet.JHMissing = req.wap.sprint.workDaysNeeded - toRet.JHIntended;
            return toRet;
        })
        return res.status(200).send((allUsers.length == 1) ? allUsers[0] : allUsers);
    }
}

export default UserController;