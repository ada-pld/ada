import IController from "../controllers/controller";
import express, {Request, Response} from "express";
import { authBearer } from "../middlewares/auth";
import { checkPermAPI } from "../middlewares/checkPerms";
import RendezVous from "../models/rendezVous";
import User from "../models/user";
import RendezVousUserAttendance from "../models/rendezVousUserAttendance";
import { sendRendezVousCreatedMail, sendRendezVousPassedMail } from "../mails";
import { Op } from "sequelize";
import RendezVousGroup from "../models/rendezVousGroup";

class RendezVousController implements IController {
    public path = "/rendezVous";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/list", authBearer, checkPermAPI("MAINTENER"), this.list);
        this.router.get("/:id", authBearer, checkPermAPI("MAINTENER"), this.getOne);
        this.router.post("/create", authBearer, checkPermAPI("EDITOR"), this.create);
        this.router.post("/edit", authBearer, checkPermAPI("EDITOR"), this.edit);
    }

    private list = async (req: Request, res: Response) => {
        let rendezVouss = await RendezVous.findAll({
            include: [
                RendezVousUserAttendance,
                RendezVousGroup
            ],
            order: [
                ["date", "DESC"]
            ]
        });
        let arrOfPromises = [];
        rendezVouss = rendezVouss.map((rendezVous) => {
            if (req.user.role == "MAINTENER" && rendezVous.sheduling != "PASSED") {
                rendezVous = rendezVous.toJSON();
                delete rendezVous.userAttendances;
                delete rendezVous.report;
                return rendezVous;
            }
            rendezVous.userAttendances.forEach((x) => {
                arrOfPromises.push(new Promise(async (resolve, reject) => {
                    x.user = await x.$get("user");
                    resolve(true);
                }));
            })
            return rendezVous;
        })
        await Promise.all(arrOfPromises);

        return res.status(200).send(rendezVouss);
    }

    private getOne = async (req: Request, res: Response) => {
        let rendezVous = await RendezVous.findOne({
            include: [
                RendezVousUserAttendance,
                RendezVousGroup
            ],
            where: {
                id: req.params.id
            }
        });
        if (!rendezVous) {
            return res.status(400).send({
                message: "Invalid id."
            });
        }
        if (req.user.role == "MAINTENER" && rendezVous.sheduling != "PASSED") {
            rendezVous = rendezVous.toJSON();
            delete rendezVous.userAttendances;
            delete rendezVous.report;
        } else {
            let arrOfPromises = [];
            rendezVous.userAttendances.forEach((x) => {
                arrOfPromises.push(new Promise(async (resolve, reject) => {
                    x.user = await x.$get("user");
                    resolve(true);
                }));
            })
            await Promise.all(arrOfPromises);
        }

        return res.status(200).send(rendezVous);
    }

    private create = async (req: Request, res: Response) => {
        if (!req.body.date || !req.body.agenda || !req.body.title || !req.body.location || !req.body.duration) {
            return res.status(400).send({
                message: "Invalid body."
            });
        }
        const date = new Date(req.body.date);
        if (date.toString() === "Invalid Date") {
            return res.status(400).send({
                message: "Invalid date."
            })
        }
        const duration = parseInt(req.body.duration);
        if (isNaN(duration)) {
            return res.status(400).send({
                message: "Invalid duration."
            })
        }
        const [allUsers, rendezVous] = await Promise.all([
            User.findAll({
                where: {
                    role: {
                        [Op.not]: "USER"
                    }
                }
            }),
            RendezVous.create({
                title: req.body.title,
                date: date,
                agenda: req.body.agenda.replace(/[\r]+/g, ''),
                duration: duration,
                location: req.body.location,
            })
        ])
        if (req.body.newGroup) {
            if (!req.body.newGroup.name || !req.body.newGroup.color || !req.body.newGroup.duration || !req.body.newGroup.location) {
                return res.status(400).send({
                    message: "Invalid new group params"
                });
            }
            const duration = parseInt(req.body.newGroup.duration);
            if (isNaN(duration)) {
                return res.status(400).send({
                    message: "Invalid duration in newGroup."
                });
            }
            const rendezVousGroup = await RendezVousGroup.create({
                groupName: req.body.newGroup.name,
                groupColor: req.body.newGroup.color,
                typicalDuration: duration,
                typicalLocation: req.body.newGroup.location,
            });
            rendezVous.rendezVousGroupId = rendezVousGroup.id;
            await rendezVous.save();
        } else if(req.body.groupId) {
            const rendezVousGroup = await RendezVousGroup.findOne({
                where: {
                    id: req.body.groupId
                }
            });
            if (!rendezVousGroup) {
                return res.status(400).send({
                    message: "Invalid rendezVousGroup id"
                });
            }
            rendezVous.rendezVousGroupId = rendezVousGroup.id;
            await rendezVous.save();
        }
        let allPromises = [];
        for (const user of allUsers) {
            allPromises.push(new Promise(async (resolve, reject) => {
                const userAppointment = await RendezVousUserAttendance.create();
                await Promise.all([
                    userAppointment.$set('rendezVous', rendezVous),
                    userAppointment.$set('user', user)
                ])
                sendRendezVousCreatedMail(user, date, rendezVous.agenda);
                resolve(true);
            }));
        }
        await Promise.all(allPromises);
        return res.status(200).send({
            message: "Success."
        })
    }

    private edit = async (req: Request, res: Response) => {
        let newPassed = false;
        if (!req.body.id) {
            return res.status(400).send({
                message: "Invalid body."
            })
        }
        const rendezVous = await RendezVous.findOne({
            where: {
                id: req.body.id
            },
            include: [
                {
                    model: RendezVousUserAttendance,
                    include: [
                        User
                    ]
                },
                {
                    model: RendezVousGroup
                }
            ]
        });
        if (!rendezVous) {
            return res.status(400).send({
                message: "Invalid id."
            });
        }
        let date = undefined;
        if (req.body.date) {
            date = new Date(req.body.date)
            if (date.toString() === "Invalid Date") {
                return res.status(400).send({
                    message: "Invalid date."
                })
            }
        }
        let duration = undefined;
        if (req.body.duration) {
            duration = parseInt(req.body.duration);
            if (isNaN(duration)) {
                return res.status(400).send({
                    message: "Invalid duration."
                })
            }
        }
        if (req.body.newGroup) {
            if (!req.body.newGroup.name || !req.body.newGroup.color || !req.body.newGroup.duration || !req.body.newGroup.location) {
                return res.status(400).send({
                    message: "Invalid new group params"
                });
            }
            const duration = parseInt(req.body.newGroup.duration);
            if (isNaN(duration)) {
                return res.status(400).send({
                    message: "Invalid duration in newGroup."
                });
            }
            const rendezVousGroup = await RendezVousGroup.create({
                groupName: req.body.newGroup.name,
                groupColor: req.body.newGroup.color,
                typicalDuration: duration,
                typicalLocation: req.body.newGroup.location,
            });
            rendezVous.rendezVousGroupId = rendezVousGroup.id;
            await rendezVous.save();
        } else if(req.body.groupId) {
            const rendezVousGroup = await RendezVousGroup.findOne({
                where: {
                    id: req.body.groupId
                }
            });
            if (!rendezVousGroup) {
                return res.status(400).send({
                    message: "Invalid rendezVousGroup id"
                });
            }
            rendezVous.rendezVousGroupId = rendezVousGroup.id;
            await rendezVous.save();
        }
        rendezVous.set({
            title: req.body.title ? req.body.title : rendezVous.title,
            date: date ?? rendezVous.date,
            agenda: req.body.agenda ? req.body.agenda.replace(/[\r]+/g, '') : rendezVous.agenda,
            report: req.body.report ? req.body.report.replace(/[\r]+/g, '') : rendezVous.report,
            duration: req.body.duration ? req.body.duration : rendezVous.duration,
            location: req.body.location ? req.body.location : rendezVous.location,
        })
        if (req.body.passed && req.body.passed === true) {
            if (rendezVous.sheduling != "PASSED") {
                newPassed = true;
            }
            rendezVous.sheduling = "PASSED";
        }
        let allPromises = [];
        allPromises.push(rendezVous.save());
        for (const attendance of rendezVous.userAttendances) {
            if (req.body["presence_" + attendance.id]) {
                const value = req.body["presence_" + attendance.id];
                if (value == "na") {
                    attendance.attendance = "UNDEFINED";
                } else if (value == "present") {
                    attendance.attendance = "PRESENT";
                } else if (value == "absent") {
                    attendance.attendance = "ABSENT";
                }
                allPromises.push(attendance.save());
            }
        }
        if (newPassed) {
            for (const attendance of rendezVous.userAttendances) {
                let userAttendanceStr = "indéfini";
                if (attendance.attendance == "PRESENT") {
                    userAttendanceStr = "present";
                } else if (attendance.attendance == "ABSENT") {
                    userAttendanceStr = "absent";
                }
                sendRendezVousPassedMail(attendance.user, rendezVous.date, rendezVous.report, userAttendanceStr);
            }
        }
        await Promise.all(allPromises);
        return res.status(200).send({
            message: "Success."
        });
    }

}

export default RendezVousController;