import IController from "./controller";
import express, {Request, Response} from "express";
import { authUser } from "../middlewares/auth";
import Card from "../models/card";
import User from "../models/user";
import Part from "../models/part";
import Sprint from "../models/sprint";
import { Op } from "sequelize";
import { sendCardAwaitingApprovalEmail } from "../mails";

class MycardsController implements IController {
    public path = "/mycards";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, this.mycards);
        this.router.get("/create", authUser, this.createGET);
        this.router.post("/create", authUser, this.createPOST);
        this.router.get("/edit/:id", authUser, this.editGET);
        this.router.post("/edit", authUser, this.editPOST);
        this.router.get("/finished/:id", authUser, this.setCardFinished);
        this.router.get("/inprogress/:id", authUser, this.setCardInProgress);
        this.router.get("/notstart/:id", authUser, this.setCardNotStarted);
    }

    private mycards = async (req: Request, res: Response) => {
        let waitingApproval :Card[] = null;
        let allApproved :Card[] = null;
        if (req.wap.sprint) {
            waitingApproval = await Card.findAll({
                where: {
                    status: {
                        [Op.in]: ["WAITING_APPROVAL", "REJECTED"]
                    },
                    sprintId: req.wap.sprint.id
                },
                include: [
                    User,
                    Part,
                ]
            })
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
                ]
            })
            waitingApproval = waitingApproval.filter((element) => {
                return element.assignees.map(a => a.id).includes(req.user.id);
            });
            allApproved = allApproved.filter((element) => {
                return element.assignees.map(a => a.id).includes(req.user.id);
            })
        }
        return res.render("mycards/mycards", {
            currentPage: '/mycards',
            wap: req.wap,
            user: req.user,
            waitingApproval: waitingApproval,
            allApproved: allApproved
        })
    }

    private createGET = (req: Request, res: Response) => {
        return res.render("mycards/create_card", {
            currentPage: '/mycards',
            wap: req.wap,
            user: req.user
        });
    }

    private createPOST = async (req: Request, res: Response) => {
        if (!req.body.name || !req.body.who || !req.body.task || !req.body.description || !req.body.workingDays || !req.body.dods || !req.body.part)
            return res.redirect("/mycards/create?error=invalid_body");
        let workingDays = 0;
        let assignees :User[] = [];
        let part :Part;
        try {
            workingDays = parseInt(req.body.workingDays);
            part = await Part.findOne({
                where: {
                    id: req.body.part
                }
            });
            if (!part) throw `No part with id ${req.body.part}`;
            if (req.body.assignees) {
                let assArr :string[] = [];
                if (Array.isArray(req.body.assignees)) {
                    for (const s of req.body.assignees)
                        assArr.push(s)
                } else {
                    assArr.push(req.body.assignees);
                }
                for (const assignee of assArr) {
                    const one = await User.findOne({
                        where: {
                            id: assignee
                        }
                    });
                    if (!one) throw `No user with id ${assignee}`;
                    assignees.push(one);
                }
            }
            assignees.push(req.user);
        } catch (e) {
            return res.redirect("/mycards/create?error=error");
        }
        const card = Card.build();
        card.name = req.body.name;
        card.asWho = req.body.who;
        card.task = req.body.task;
        card.description = req.body.description.replace(/[\r]+/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd();
        card.dods = req.body.dods.replace(/[\r]+/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd();
        card.workingDays = workingDays;
        await card.save();
        await card.$set('part', part);
        await card.$set('assignees', assignees);
        await card.$set('sprint', req.wap.sprint);
        await card.save();
        
        const editorAndAdmins = await User.getEditorAndAdmins();
        for (const user of editorAndAdmins) {
            sendCardAwaitingApprovalEmail(user, req.user, card);
        }
        return res.redirect("/mycards/?info=success");
    }

    private editGET = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/mycards/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User,
                Part,
            ]
        });
        if (!toEdit)
            return res.redirect("/mycards/?error=bad_id");
        if (toEdit.status != "REJECTED" && toEdit.status != "WAITING_APPROVAL")
            return res.redirect("/mycards/?error=cant_edit");
        let assigneesIds :string[] = [];
        for (const user of toEdit.assignees) {
            assigneesIds.push(user.id);
        }
        return res.render("mycards/edit_card", {
            currentPage: '/users',
            wap: req.wap,
            user: req.user,
            toEdit: toEdit,
            assigneesId: assigneesIds
        })
    }
    
    private editPOST = async (req: Request, res: Response) => {
        if (!req.body.id)
            return res.redirect("/mycards/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.body.id
            },
            include: [
                User,
            ]
        });
        if (!toEdit)
            return res.redirect("/mycards/?error=invalid_id");
        if (toEdit.status != "REJECTED" && toEdit.status != "WAITING_APPROVAL")
            return res.redirect("/mycards/?error=cant_edit");
        let assigneesIds :string[] = [];
        for (const user of toEdit.assignees) {
            assigneesIds.push(user.id);
        }
        if (!assigneesIds.includes(req.user.id))
            return res.redirect("/mycards/?error=not_your_card");
        if (!req.body.name || !req.body.who || !req.body.task || !req.body.description || !req.body.workingDays || !req.body.dods || !req.body.part)
            return res.redirect(`/mycards/edit/${req.body.id}?error=invalid_body`);
        let workingDays = 0;
        let assignees :User[] = [];
        let part :Part;

        try {
            workingDays = parseInt(req.body.workingDays);
            part = await Part.findOne({
                where: {
                    id: req.body.part
                }
            });
            if (!part) throw `No part with id ${req.body.part}`;
            if (req.body.assignees) {
                let assArr :string[] = [];
                if (Array.isArray(req.body.assignees)) {
                    for (const s of req.body.assignees)
                        assArr.push(s)
                } else {
                    assArr.push(req.body.assignees);
                }
                for (const assignee of assArr) {
                    const one = await User.findOne({
                        where: {
                            id: assignee
                        }
                    });
                    if (!one) throw `No user with id ${assignee}`;
                    assignees.push(one);
                }
            }
            assignees.push(req.user);
        } catch (e) {
            return res.redirect(`/mycards/edit/${req.body.id}?error=error`);
        }
        toEdit.name = req.body.name;
        toEdit.asWho = req.body.who;
        toEdit.task = req.body.task;
        toEdit.description = req.body.description.replace(/[\r]+/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '');
        toEdit.dods = req.body.dods.replace(/[\r]+/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '');
        toEdit.workingDays = workingDays;
        await toEdit.save();
        await toEdit.$set('part', part);
        await toEdit.$set('assignees', assignees);
        await toEdit.save();

        return res.redirect("/mycards/?info=success");
    }

    private setCardFinished = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/mycards/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!toEdit)
            return res.redirect("/mycards/?error=bad_id");
        let allAssigneesIds :string[] = [];
        for (const user of toEdit.assignees)
            allAssigneesIds.push(user.id);
        if (!allAssigneesIds.includes(req.user.id))
            return res.redirect("/mycards/?error=no_permissions");
        toEdit.status = "FINISHED";
        await toEdit.save();
        return res.redirect("/mycards?info=success");
    }

    private setCardInProgress = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/mycards/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!toEdit)
            return res.redirect("/mycards/?error=bad_id");
        let allAssigneesIds :string[] = [];
        for (const user of toEdit.assignees)
            allAssigneesIds.push(user.id);
        if (!allAssigneesIds.includes(req.user.id))
            return res.redirect("/mycards/?error=no_permissions");
        toEdit.status = "STARTED";
        await toEdit.save();
        return res.redirect("/mycards?info=success");
    }

    private setCardNotStarted = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/mycards/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!toEdit)
            return res.redirect("/mycards/?error=bad_id");
        let allAssigneesIds :string[] = [];
        for (const user of toEdit.assignees)
            allAssigneesIds.push(user.id);
        if (!allAssigneesIds.includes(req.user.id))
            return res.redirect("/mycards/?error=no_permissions");
        toEdit.status = "NOT_STARTED";
        await toEdit.save();
        return res.redirect("/mycards?info=success");
    }
}

export default MycardsController;