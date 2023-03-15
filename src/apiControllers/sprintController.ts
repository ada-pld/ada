import IController from "../controllers/controller";
import express, {Request, Response} from "express";
import { checkPerm, checkPermAPI } from "../middlewares/checkPerms";
import { authBearer, authUser } from "../middlewares/auth";
import Card from "../models/card";
import Sprint from "../models/sprint";
import User from "../models/user";
import { Op } from "sequelize";
import Part from "../models/part";

class SprintController implements IController {
    public path = "/sprint";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/active", authBearer, this.active);
        this.router.get("/list", authBearer, checkPermAPI("EDITOR"), this.listSprint);
        this.router.get("/use/:id", authBearer, checkPermAPI("EDITOR"), this.useSprint);
        this.router.post("/create", authBearer, checkPermAPI("EDITOR"), this.createSprint);
    }

    private active = async (req: Request, res: Response) => {
        return res.status(200).send(req.wap.sprint);
    }

    private listSprint = async (req: Request, res: Response) => {
        const allSprints = await Sprint.findAll({
            include: [
                Card
            ]
        });
        
        allSprints.forEach((x) => {
            const resultObject = x.toJSON() as (Sprint & {totalCards: number});
            resultObject.totalCards = x.cards.filter(x => !["REJECTED", "WAITING_APPROVAL"].includes(x.status)).length;
        });

        return res.status(200).send(allSprints);
    }

    private useSprint = async (req: Request, res: Response) => {
        const sprint = await Sprint.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!sprint) {
            return res.status(400).send({
                message: "Invalid id"
            });
        }
        const sprints = await Sprint.findAll();
        let allPromises = [];
        sprints.forEach((x) => {
            if (x.id == req.params.id as any) {
                allPromises.push(new Promise(async (resolve, reject) => {
                    x.active = true;
                    await x.save();
                    resolve(true);
                }))
            } else {
                allPromises.push(new Promise(async (resolve, reject) => {
                    x.active = false;
                    await x.save();
                    resolve(true);
                }))
            }
        })
        await Promise.all(allPromises);
        req.wap.sprint = sprint;
        return res.status(200).send({
            message: "Success."
        });
    }

    private createSprint = async (req: Request, res: Response) => {
        if (!req.body.name || !req.body.workDaysNeeded) {
            return res.status(400).send({
                message: "Invalid body."
            });
        }
        let value = parseInt(req.body.workDaysNeeded);
        if (isNaN(value) || value < 0) {
            return res.status(400).send({
                message: "Invalid workDays."
            })
        }
        const alreadyExists = await Sprint.findOne({
            where: {
                name: req.body.name
            }
        });
        if (alreadyExists) {
            return res.status(400).send({
                message: "Name already in use."
            });
        }
        await Sprint.create({
            name: req.body.name,
            workDaysNeeded: value
        });
        return res.status(200).send({
            message: "Success."
        });
    }

}

export default SprintController;