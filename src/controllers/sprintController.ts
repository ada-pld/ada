import IController from "./controller";
import express, {Request, Response} from "express";
import { checkPerm } from "../middlewares/checkPerms";
import { authUser } from "../middlewares/auth";
import { Op } from "sequelize";
import Sprint from "../models/sprint";
import User from "../models/user";
import Card from "../models/card";
import Part from "../models/part";

class SprintController implements IController {
    public path = "/sprint";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, checkPerm("MAINTENER"), this.getSprint);
        this.router.get("/create", authUser, checkPerm("EDITOR"), this.createSprintGET);
        this.router.post("/create", authUser, checkPerm("EDITOR"), this.createSprintPOST);
        this.router.get("/use/:sprint", authUser, checkPerm("EDITOR"), this.useSprint);
    }

    private getSprint = async (req: Request, res: Response) => {
        const allSprints = await Sprint.findAll();
        const allUsers = await User.findAll({
            order: [['firstname', 'ASC'], ['lastname', 'ASC']],
            include: [
                Card
            ]
        })

        allSprints.forEach(async (x) => {
            const resultObject = x as any;
            resultObject.totalCards = await x.$count("Cards", {
                where: {
                    status: {
                        [Op.notIn]: ["REJECTED", "WAITING_APPROVAL"]
                    }
                }
            });
        })

        for (const user of allUsers) {
            user.cards = user.cards.filter((cards) => {
                return (cards.sprintId == req.wap.sprint.id) && !(cards.status == "REJECTED" || cards.status == "WAITING_APPROVAL");
            })
            let totalJH = 0;
            let intendedJH = 0;
            let totalDones = 0;
            let totalProgress = 0;
            let totalNotStarted = 0;
            for (const card of user.cards) {
                card.part = await card.$get('part');
                card.assignees = await card.$get('assignees');
                if (card.status == "FINISHED") {
                    totalDones++;
                    totalJH += (card.workingDays / card.assignees.length);
                } else if (card.status == "STARTED") {
                    totalProgress++;
                } else if (card.status == "NOT_STARTED") {
                    totalNotStarted++;
                }
                intendedJH += (card.workingDays / card.assignees.length);
            }
            user["totalJH"] = totalJH;
            user["intendedJH"] = intendedJH;
            user["totalDones"] = totalDones;
            user["totalProgress"] = totalProgress;
            user["totalNotStarted"] = totalNotStarted;
        }

        return res.render("sprint/sprint", {
            currentPage: '/sprint',
            canEditSprint: (req.user.role == "ADMIN" || req.user.role == "EDITOR"),
            wap: req.wap,
            user: req.user,
            allSprints: allSprints,
            allUsers: allUsers
        })
    }

    private createSprintGET = async (req: Request, res: Response) => {
        return res.render("sprint/create_sprint", {
            currentPage: '/sprint',
            wap: req.wap,
            user: req.user
        });
    }

    private createSprintPOST = async (req: Request, res: Response) => {
        if (!req.body.name || !req.body.workDaysNeeded)
            return res.redirect("/sprint/create?error=invalid_body");
        let value :number = 0;
        try {
            value = parseInt(req.body.workDaysNeeded);
        } catch (e) {
            return res.redirect("/sprint/create?error=invalid_body");
        }
        const already_exists = await Sprint.findOne({
            where: {
                name: req.body.name
            }
        });
        if (already_exists)
            return res.redirect("/sprint/create?error=already_exists");
        await Sprint.create({
            name: req.body.name,
            workDaysNeeded: value
        });
        return res.redirect("/sprint/?info=success");
    }

    private useSprint = async (req: Request, res: Response) => {
        if (!req.params.sprint)
            return res.redirect("/sprint/?error=invalid_id");
        const sprint = await Sprint.findOne({
            where: {
                id: req.params.sprint
            }
        });
        if (!sprint)
            return res.redirect("/sprint/?error=invalid_id");
        const sprints = await Sprint.findAll({
            where: {
                active: true
            }
        });
        for (const active_sprint of sprints) {
            active_sprint.active = false;
            await active_sprint.save();
        }
        sprint.active = true;
        req.wap.sprint = sprint;
        await sprint.save();
        return res.redirect("/sprint?info=success");
    }
}

export default SprintController;