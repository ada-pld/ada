import IController from "../controllers/controller";
import express, {Request, Response} from "express";
import { checkPerm, checkPermAPI } from "../middlewares/checkPerms";
import { authBearer, authUser } from "../middlewares/auth";
import { Op } from "sequelize";
import Part from "../models/part";
import Card, { Status } from "../models/card";
import Sprint from "../models/sprint";
import User from "../models/user";
import { sendApprovalEmail, sendCardAwaitingApprovalEmail, sendRejectionEmail } from "../mails";

class CardController implements IController {
    public path = "/card";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post("/create", authBearer, checkPerm("MAINTENER"), this.create);
        this.router.post("/edit/:id", authBearer, checkPerm("MAINTENER"), this.edit);
        this.router.get("/update/:id/:status", authBearer, checkPerm("MAINTENER"), this.updateStatus)
        this.router.get("/approve/:id", authBearer, checkPerm("EDITOR"), this.approve);
        this.router.post("/reject/:id", authBearer, checkPerm("EDITOR"), this.reject);
        this.router.get("/delete/:id", authBearer, checkPerm("MAINTENER"), this.delete);
    }

    private create = async (req: Request, res: Response) => {
        console.log(req.body);
        if (!req.body.name || !req.body.asWho || !req.body.task || !req.body.description || !req.body.workingDays || !req.body.dods || !req.body.partId) {
            console.log(req.body.name)
            console.log(req.body.asWho)
            console.log(req.body.task)
            console.log(req.body.description)
            console.log(req.body.workingDays)
            console.log(req.body.dods)
            console.log(req.body.partId)
            return res.status(400).send({
                message: "Invalid body."
            });
        }
        let workingDays = parseFloat(req.body.workingDays);
        let assignees :User[] = [];
        let part: Part = await Part.findOne({
            where: {
                id: req.body.partId
            }
        })
        if (!part) {
            return res.status(400).send({
                message: "Invalid part id."
            })
        }
        if (isNaN(workingDays) || workingDays <= 0) {
            return res.status(400).send({
                message: "Invalid working days."
            })
        }
        workingDays = Math.floor(workingDays * 10);
        if (workingDays % 10 >= 5) {
            workingDays = Math.floor(workingDays / 10)
            workingDays += 0.5
        } else {
            workingDays = Math.floor(workingDays / 10);
        }
        if (req.body.assignees) {
            let assArr :string[] = [];
            if (Array.isArray(req.body.assignees)) {
                for (const s of req.body.assignees) {
                    assArr.push(s);
                }
            } else {
                assArr.push(req.body.assignees);
            }
            for (const assigneeId of assArr) {
                const one = await User.findOne({
                    where: {
                        id: {
                            [Op.eq]: assigneeId
                        },
                        role: {
                            [Op.not]: "USER"
                        }
                    }
                });
                if (!one) {
                    return res.status(400).send({
                        message: `Invalid id for assignee: ${assigneeId}`
                    })
                }
                assignees.push(one);
            }
        }
        assignees.push(req.user);
        const card = await Card.create({
            name: req.body.name,
            asWho: req.body.asWho,
            task: req.body.task,
            description: req.body.description.replace(/[\r]+/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd(),
            dods: req.body.dods.replace(/[\r]+/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd(),
            workingDays: workingDays,
            partId: part.id,
            sprintId: req.wap.sprint.id
        });
        await card.$set("assignees", assignees);
        await card.save();

        const editorAndAdmins = await User.getEditorAndAdmins();
        for (const user of editorAndAdmins) {
            sendCardAwaitingApprovalEmail(user, req.user, card);
        }
        return res.status(200).send({
            message: "Success"
        })
    }

    private edit = async (req: Request, res: Response) => {
        const card = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!card) {
            return res.status(400).send({
                message: "Invalid card id."
            });
        }
        if (card.status != "REJECTED" && card.status != "WAITING_APPROVAL") {
            if (req.user.role != "ADMIN" && req.user.role != "EDITOR") {
                return res.status(403).send({
                    message: "You don't have the permission to edit this card."
                })
            }
        }
        let assignees :User[] = null;
        let name: string = req.body.name ? req.body.name : card.name;
        let asWho: string = req.body.asWho ? req.body.asWho : card.asWho;
        let task: string = req.body.task ? req.body.task : card.task;
        let workingDays: number = card.workingDays;
        let partId: number = card.partId;
        let description: string = card.description;
        let dods: string = card.dods;

        if (req.body.workingDays) {
            workingDays = parseInt(req.body.workingDays);
            if (isNaN(workingDays)) {
                return res.status(400).send({
                    message: "Invalid number for working days."
                })
            }
        }
        if (req.body.partId) {
            const part = await Part.findOne({
                where: {
                    id: req.body.partId
                }
            })
            if (!part) {
                return res.status(400).send({
                    message: "Invalid part id."
                })
            }
            partId = part.id;
        }
        if (req.body.assignees) {
            let assArr: string[] = [];
            if (Array.isArray(req.body.assignees)) {
                for (const s of req.body.assignees) {
                    assArr.push(s)
                }
            } else {
                assArr.push(req.body.assignees);
            }
            for (const assigneeId of assArr) {
                const one = await User.findOne({
                    where: {
                        id: {
                            [Op.eq]: assigneeId
                        },
                        role: {
                            [Op.not]: "USER"
                        }
                    }
                })
                if (!one) {
                    return res.status(400).send({
                        message: `Invalid assigneeId in body: ${assigneeId}`
                    })
                }
                assignees.push(one);
            }
        }
        if (req.body.description) {
            description = req.body.description.replace(/[\r]+/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd();
        }
        if (req.body.dods) {
            dods = req.body.dods.replace(/[\r]+/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd();
        }
        card.set({
            name: name,
            asWho: asWho,
            task: task,
            workingDays: workingDays,
            partId: partId,
            description: description,
            dods: dods
        })
        if (assignees != null) {
            await card.$set('assignees', assignees);
        }
        if (card.status != "REJECTED" && card.status != "WAITING_APPROVAL") {
            if (card.lastPLDEdit != card.actPLD) {
                card.lastPLDEdit = card.actPLD;
                card.version = card.version + 1;
            }
        }
        if (card.status == "REJECTED") {
            card.status = "WAITING_APPROVAL";
        }
        await card.save();
        return res.status(200).send({
            message: "Success"
        })
    }

    private updateStatus = async (req: Request, res: Response) => {
        const card = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        const status = req.params.status.toLowerCase();
        if (status != "finished" && status != "inprogress" && status != "notstarted") {
            return res.status(400).send({
                message: "Invalid status."
            })
        }
        if (!card) {
            return res.status(400).send({
                message: "Invalid card id."
            })
        }
        if (card.status == "WAITING_APPROVAL" || card.status == "REJECTED") {
            return res.status(400).send({
                message: "You cannot update the status of this card."
            })
        }
        if (!card.assignees.find(x => x.id == req.user.id)) {
            if (req.user.role != "ADMIN" && req.user.role != "EDITOR") {
                return res.status(403).send({
                    message: "You don't have the permission to perform this action."
                })
            }
        }
        let statusToSet :Status = "REJECTED";
        if (status == "finished")
            statusToSet = "FINISHED";
        if (status == "inprogress")
            statusToSet = "STARTED";
        if (status == "notstarted")
            statusToSet = "NOT_STARTED";
        card.status = statusToSet;
        await card.save();
        return res.status(200).send({
            message: "Success."
        })
    }
    
    private approve = async (req: Request, res: Response) => {
        const card = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!card) {
            return res.status(400).send({
                message: "Invalid card id."
            })
        }
        if (card.status != "WAITING_APPROVAL") {
            return res.status(400).send({
                message: "This card as already been approved."
            })
        }
        const totalCards = await Card.count({
            where: {
                status: {
                    [Op.notIn]: ["WAITING_APPROVAL", "REJECTED"]
                },
                sprintId: req.wap.sprint.id,
                partId: card.partId
            }
        })
        card.idInSprint = totalCards + 1;
        card.status = "NOT_STARTED";
        await card.save();
        for (const user of card.assignees) {
            sendApprovalEmail(user, card);
        }
        return res.status(200).send({
            message: "Success."
        })
    }

    private reject = async (req: Request, res: Response) => {
        const card = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!card) {
            return res.status(400).send({
                message: "Invalid card id."
            })
        }
        if (card.status != "WAITING_APPROVAL") {
            return res.status(400).send({
                message: "This card as already been approved."
            })
        }
        if (req.body.reason) {
            return res.status(400).send({
                message: "Missing rejection reason."
            })
        }
        card.status = "REJECTED";
        card.rejectionReason = req.body.reason;
        for (const user of card.assignees) {
            sendRejectionEmail(user, card, req.body.reason);
        }
        await card.save();
        return res.status(200).send({
            message: "Success."
        })
    }

    private delete = async (req: Request, res: Response) => {
        const toEdit = await Card.findOne({
            where: {
                id: req.params.id
            },
            include: [
                User
            ]
        });
        if (!toEdit) {
            return res.status(400).send({
                message: "Invalid id."
            })
        }
        if (req.user.role != "ADMIN" && req.user.role != "EDITOR") {
            if (toEdit.assignees.find(x => x.id == req.user.id)) {
                return res.status(403).send({
                    message: "You don't have the permission to perform this action."
                })
            }
        }
        if (toEdit.status != "REJECTED" && toEdit.status != "WAITING_APPROVAL") {
            return res.status(400).send({
                message: "This card as already been approved."
            })
        }
        await toEdit.destroy();
        return res.status(200).send({
            message: "Success"
        })
    }

}

export default CardController;