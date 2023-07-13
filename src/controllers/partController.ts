import IController from "./controller";
import express, {Request, Response} from "express";
import { checkPermAPI } from "../middlewares/checkPerms";
import { authBearer } from "../middlewares/auth";
import Part from "../models/part";
import Card from "../models/card";
import Sprint from "../models/sprint";
import PollingController from "./pollingController";

class PartController implements IController {
    public path = "/part";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/list", authBearer, checkPermAPI("MAINTENER"), this.listParts);
        this.router.post("/create", authBearer, checkPermAPI("EDITOR"), this.createPart);
    }

    private listParts = async (req: Request, res: Response) => {
        let allParts = await Part.findAll({
            include: [
                {
                    model: Card,
                    include: [
                        Sprint
                    ]
                }
            ]
        })
        
        if (req.ada.sprint && (req.user.role == "ADMIN" || req.user.role == "EDITOR")) {
            allParts.forEach((x) => {
                const resultObject = x.toJSON() as (Part & {totalInSprint: number, totalCards: number});
                resultObject.totalInSprint = x.cards.filter(x => x.sprintId == req.ada.sprint.id).length;
                resultObject.totalCards = x.cards.length;
            });
        } else {
            allParts = allParts.map(x => {x = x.toJSON(); delete x.cards; return x;});
        }

        return res.status(200).send(allParts);
    }

    private createPart = async (req: Request, res: Response) => {
        if (!req.body.name) {
            return res.status(400).send({
                message: "Invalid body."
            });
        }
        const alreadyExists = await Part.findOne({
            where: {
                name: req.body.name
            }
        });
        if (alreadyExists) {
            return res.status(400).send({
                message: "Name already in use."
            });
        }
        await Part.create({
            name: req.body.name
        });
        PollingController.addToPollList('useListPartsQuery');
        return res.status(200).send({
            message: "Success."
        });
    }

}

export default PartController;