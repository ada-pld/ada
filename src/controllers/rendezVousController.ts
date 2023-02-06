import IController from "./controller";
import express, {Request, Response} from "express";
import { authUser } from "../middlewares/auth";
import { checkPerm } from "../middlewares/checkPerms";
import RendezVous from "../models/rendezVous";
import User from "../models/user";
import RendezVousUserAttendance from "../models/rendezVousUserAttendance";
import dayjs from "dayjs";
import ejs from "ejs";
import { sendRendezVousCreatedMail, sendRendezVousPassedMail } from "../mails";

class RendezVousController implements IController {
    public path = "/rendezVous";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, checkPerm("MAINTENER"), this.rendezVous);
        this.router.get("/create", authUser, checkPerm("EDITOR"), this.createGET);
        this.router.post("/create", authUser, checkPerm("EDITOR"), this.createPOST);
        this.router.get("/edit/:id", authUser, checkPerm("EDITOR"), this.editGET);
        this.router.post("/edit/:id", authUser, checkPerm("EDITOR"), this.editPOST);
    }

    private rendezVous = async (req: Request, res: Response) => {
        const canEdit = req.user.role == "ADMIN" || req.user.role == "EDITOR";
        const rendezVouss = await RendezVous.findAll({
            include: [
                {
                    model: RendezVousUserAttendance,
                    include: [
                        User
                    ]
                }
            ],
            order: [
                ["date", "DESC"]
            ]
        });

        return res.render("rendezVous/rendezVous", {
            currentPage: '/rendezVous',
            wap: req.wap,
            user: req.user,
            canEdit: canEdit,
            rendezVouss: rendezVouss,
            escapeXML: ejs.escapeXML,
            dayjs: dayjs
        })
    }

    private createGET = (req: Request, res: Response) => {
        return res.render("rendezVous/createRendezVous", {
            currentPage: '/rendezVous',
            wap: req.wap,
            user: req.user
        });
    }

    private createPOST = async (req: Request, res: Response) => {
        if (!req.body.date || !req.body.agenda) return res.malformed();
        const date = new Date(req.body.date);
        const allUsers = await User.findAll();
        const rendezVous = await RendezVous.create({
            date: date,
            agenda: req.body.agenda.replace(/[\r]+/g, '')
        });

        for (const user of allUsers) {
            const userAppointment = await RendezVousUserAttendance.create();
            await userAppointment.$set('rendezVous', rendezVous);
            await userAppointment.$set('user', user);
            sendRendezVousCreatedMail(user, date, rendezVous.agenda);
        }

        return res.redirect("/rendezVous/?info=success");
    }

    private editGET = async (req: Request, res: Response) => {
        const toEdit = await RendezVous.findOne({
            where: {
                id: req.params.id as any
            },
            include: [
                {
                    model: RendezVousUserAttendance,
                    include: [
                        User
                    ]
                }
            ]
        });
        return res.render("rendezVous/editRendezVous", {
            currentPage: '/rendezVous',
            wap: req.wap,
            user: req.user,
            toEdit: toEdit,
            passed: toEdit.sheduling == "PASSED",
            dayjs: dayjs
        })
    }

    private editPOST = async (req: Request, res: Response) => {
        let newPassed = false;
        const rendezVous = await RendezVous.findOne({
            where: {
                id: req.params.id
            },
            include: [
                {
                    model: RendezVousUserAttendance,
                    include: [
                        User
                    ]
                }
            ]
        })
        if (!rendezVous) return res.redirect("/rendezVous/?error=invalid_id");
        if (req.body.date) {
            const date = new Date(req.body.date);
            rendezVous.date = date;
        }
        if (req.body.agenda) {
            rendezVous.agenda = req.body.agenda.replace(/[\r]+/g, '');
        }
        if (req.body.report) {
            rendezVous.report = req.body.report.replace(/[\r]+/g, '');
        }
        if (req.body.passed && req.body.passed == "true") {
            if (rendezVous.sheduling != "PASSED") {
                newPassed = true;
            }
            rendezVous.sheduling = "PASSED";
        }
        await rendezVous.save();
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
                await attendance.save();
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
        return res.redirect("/rendezVous/?info=success");
    }

}

export default RendezVousController;