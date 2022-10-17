import express, {Request, Response} from "express";
import { Op } from "sequelize";
import { authUser } from "../middlewares/auth";
import { checkPerm } from "../middlewares/checkPerms";
import Card from "../models/card";
import DoD from "../models/dod";
import Part from "../models/part";
import User from "../models/user";
import IController from "./controller";

class DashboardController implements IController {
    public path = "/dashboard";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, this.dashboard);
        this.router.get("/finished/:id", authUser, this.setCardFinished);
        this.router.get("/inprogress/:id", authUser, this.setCardInProgress);
        this.router.get("/notstart/:id", authUser, this.setCardNotStarted);
    }

    private dashboard = async (req: Request, res: Response) => {
        let allApproved :Card[] = null;
        if (req.wap.sprint) {
            allApproved = await Card.findAll({
                where: {
                    status: {
                        [Op.notIn]: ["WAITING_APPROVAL", "REJECTED"]
                    },
                    sprintId: req.wap.sprint.id,
                },
                include: [
                    User,
                    Part,
                    DoD
                ]
            })
            allApproved.filter((element) => {
                return element.assignees.map(a => a.id).includes(req.user.id);
            })
        }
        let finished = 0;
        let inpPogress = 0;
        let notStarted = 0;
        let workingDays = 0;
        if (allApproved) {
            allApproved.forEach((element) => {
                if (element.status == "FINISHED") {
                    finished++;
                    workingDays += element.workingDays;
                } else if (element.status == "NOT_STARTED") {
                    notStarted++;
                } else if (element.status == "STARTED") {
                    inpPogress++;
                }
            })
        }
        return res.render("dashboard/dashboard", {
            wap: req.wap,
            currentPage: '/dashboard',
            user: req.user,
            allApproved: allApproved,
            totalCards: finished + inpPogress + notStarted,
            totalFinishedCards: finished,
            totalCardInProgress: inpPogress,
            totalCardNotStarted: notStarted,
            totalWorkingDays: workingDays
        });
    }

    private setCardFinished = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/dashboard/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!toEdit)
            return res.redirect("/dashboard/?error=bad_id");
        let allAssigneesIds :string[] = [];
        for (const user of toEdit.assignees)
            allAssigneesIds.push(user.id);
        if (!allAssigneesIds.includes(req.user.id))
            return res.redirect("/dashboard/?error=no_permissions");
        toEdit.status = "FINISHED";
        await toEdit.save();
        return res.redirect("/dashboard?info=success");
    }

    private setCardInProgress = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/dashboard/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!toEdit)
            return res.redirect("/dashboard/?error=bad_id");
        let allAssigneesIds :string[] = [];
        for (const user of toEdit.assignees)
            allAssigneesIds.push(user.id);
        if (!allAssigneesIds.includes(req.user.id))
            return res.redirect("/dashboard/?error=no_permissions");
        toEdit.status = "STARTED";
        await toEdit.save();
        return res.redirect("/dashboard?info=success");
    }

    private setCardNotStarted = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/dashboard/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!toEdit)
            return res.redirect("/dashboard/?error=bad_id");
        let allAssigneesIds :string[] = [];
        for (const user of toEdit.assignees)
            allAssigneesIds.push(user.id);
        if (!allAssigneesIds.includes(req.user.id))
            return res.redirect("/dashboard/?error=no_permissions");
        toEdit.status = "NOT_STARTED";
        await toEdit.save();
        return res.redirect("/dashboard?info=success");
    }
}

export default DashboardController;