import IController from "../controllers/controller";
import express, { Request, Response } from "express";
import { authBearer } from "../middlewares/auth";
import { checkPermAPI } from "../middlewares/checkPerms";
import User from "../models/user";
import * as bcrypt from "bcrypt";
import { body, validationResult } from 'express-validator';
import { checkMailTransporter, sendCreationEmail, sendPasswordForgottenMail } from "../mails";
import Card from "../models/card";

class UserController implements IController {
    public path = "/users";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/list", authBearer, checkPermAPI("EDITOR"), this.listUsers);
        this.router.post("/create", authBearer, checkPermAPI("EDITOR"), this.createUser);
        this.router.post("/edit", authBearer, this.editUser);
        this.router.post("/forgotPassword", authBearer, checkPermAPI("EDITOR"), this.forgotPassword);
    }

    private listUsers = async (req: Request, res: Response) => {
        const allUsers = await User.findAllSafe({
            include: [
                Card
            ]
        });

        allUsers.forEach((x) => {
            const resultObject = x as (User & {totalCards: number, totalWorkDays: number});
            resultObject.totalCards = 0;
            resultObject.totalWorkDays = 0;
            x.cards.forEach((x: Card) => {
                if (x.status != "REJECTED" && x.status != "WAITING_APPROVAL") {
                    resultObject.totalCards++;
                    resultObject.totalWorkDays += x.workingDays;
                }
            })
        });

        return res.status(200).send(allUsers);
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
            const created = User.build({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                role: req.body.role
            })
            if (checkMailTransporter()) {
                const password = User.generateRandomPassword();
                created.password = await bcrypt.hash(process.env.PASS_SALT + password, 10);
                sendCreationEmail(created, req.user, password);
            } else {
                created.password = await bcrypt.hash(process.env.PASS_SALT + req.wap.config.Default_Password.value, 10);
            }
            await created.save();
            return res.status(200).send({
                message: "User created."
            });
        }
    ]

    private editUser = async (req: Request, res: Response) => {
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
        if (req.user.role != "ADMIN" && req.user.role != "EDITOR") {
            if (req.user.id != user.id) {
                return res.status(403).send({
                    message: "You don't have the permission to perform this action."
                });
            }
            if (req.body.password) {
                user.isDefaultPassword = false;
                user.password = await bcrypt.hash(process.env.PASS_SALT + req.body.password, 10);
                await req.user.save();
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
                req.body.role = undefined;
            }
        }
        if (req.body.password) {
            user.isDefaultPassword = false;
            user.password = await bcrypt.hash(process.env.PASS_SALT + req.body.password, 10);
        }
        user.set({
            firstname: req.body.firstname ?? undefined,
            lastname: req.body.lastname ?? undefined,
            email: req.body.email ?? undefined,
            role: req.body.role ?? undefined
        });
        await user.save();
        return res.status(200).send({
            message: "Success."
        });
    }

    private forgotPassword = [
        body("email").normalizeEmail().isEmail(),
        async (req: Request, res: Response) => {
            if (!validationResult(res).isEmpty) {
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
            user.password = await bcrypt.hash(process.env.PASS_SALT + password, 10);
            user.isDefaultPassword = true;
            await user.save();
            await sendPasswordForgottenMail(user, password);
            return res.status(200).send({
                message: "Success."
            });
        }
    ]
}

export default UserController;