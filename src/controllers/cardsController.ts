import IController from "./controller";
import express, {Request, Response} from "express";
import { authUser } from "../middlewares/auth";
import Card from "../models/card";
import { Op } from "sequelize";
import User from "../models/user";
import Part from "../models/part";
import { checkPerm } from "../middlewares/checkPerms";
import { sendApprovalEmail, sendRejectionEmail } from "../mails";

class CardsController implements IController {
    public path = "/cards";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, checkPerm("EDITOR"), this.cards);
        this.router.get("/edit/:id", authUser, checkPerm("EDITOR"), this.editGET);
        this.router.post("/edit", authUser, checkPerm("EDITOR"), this.editPOST);
        this.router.get("/approve/:id", authUser, checkPerm("EDITOR"), this.approve);
        this.router.get("/reject/:id", authUser, checkPerm("EDITOR"), this.reject);
    }

    private cards = async (req: Request, res: Response) => {
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
        }
        return res.render("cards/cards", {
            currentPage: '/cards',
            wap: req.wap,
            user: req.user,
            waitingApproval: waitingApproval,
            allApproved: allApproved
        })
    }

    private editGET = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/cards/?error=no_id");
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
            return res.redirect("/cards/?error=bad_id");
        let assigneesIds :string[] = [];
        for (const user of toEdit.assignees) {
            assigneesIds.push(user.id);
        }
        return res.render("cards/edit_card", {
            currentPage: '/users',
            wap: req.wap,
            user: req.user,
            toEdit: toEdit,
            assigneesId: assigneesIds
        })
    }
    
    private editPOST = async (req: Request, res: Response) => {
        console.log(req.body);
        if (!req.body.id)
            return res.redirect("/cards/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.body.id
            },
            include: [
                User,
            ]
        });
        if (!toEdit)
            return res.redirect("/cards/?error=invalid_id");
        let assigneesIds :string[] = [];
        for (const user of toEdit.assignees) {
            assigneesIds.push(user.id);
        }
        if (!req.body.name || !req.body.who || !req.body.task || !req.body.description || !req.body.workingDays || !req.body.dods || !req.body.part)
            return res.redirect(`/cards/edit/${req.body.id}?error=invalid_body`);
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
        } catch (e) {
            console.log(e);
            return res.redirect(`/cards/edit/${req.body.id}?error=error`);
        }
        if (assignees.length == 0) {
            return res.redirect(`/cards/edit/${req.body.id}/?error=empty_assignees`)
        }
        toEdit.name = req.body.name;
        toEdit.asWho = req.body.who;
        toEdit.task = req.body.task;
        toEdit.description = req.body.description.replace(/[\r]+/g, '');
        toEdit.dods = req.body.dods.replace(/[\r]+/g, '');
        toEdit.workingDays = workingDays;
        if (toEdit.status != "REJECTED" && toEdit.status != "WAITING_APPROVAL") {
            toEdit.version = toEdit.version + 1;
        }
        await toEdit.save();
        await toEdit.$set('part', part);
        await toEdit.$set('assignees', assignees);
        await toEdit.save();

        return res.redirect("/cards/?info=success");
    }

    private approve = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/cards/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        })
        if (!toEdit)
            return res.redirect("/cards/?error=invalid_id");
        if (toEdit.status != "WAITING_APPROVAL")
            return res.redirect("/cards/?error=already_assigned");
        const totalCards = await Card.count({
            where: {
                status: {
                    [Op.notIn]: ["WAITING_APPROVAL", "REJECTED"]
                },
                sprintId: req.wap.sprint.id,
                partId: toEdit.partId
            }
        })
        toEdit.idInSprint = totalCards + 1;
        toEdit.status = "NOT_STARTED";
        await toEdit.save();
        for (const user of toEdit.assignees) {
            sendApprovalEmail(user, toEdit);
        }
        return res.redirect("/cards/?info=success");
    }

    private reject = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/cards/?error=no_id");
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        })
        if (!toEdit)
            return res.redirect("/cards/?error=invalid_id");
        if (toEdit.status != "WAITING_APPROVAL")
            return res.redirect("/cards/?error=already_assigned");
        toEdit.status = "REJECTED";
        await toEdit.save();
        for (const user of toEdit.assignees) {
            sendRejectionEmail(user, toEdit, "");
        }
        return res.redirect("/cards/?info=success");
    }
}

export default CardsController;