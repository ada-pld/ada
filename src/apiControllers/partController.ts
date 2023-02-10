import IController from "../controllers/controller";
import express, {Request, Response} from "express";
import { checkPerm, checkPermAPI } from "../middlewares/checkPerms";
import { authBearer, authUser } from "../middlewares/auth";
import Part from "../models/part";
import Card from "../models/card";
import Sprint from "../models/sprint";

class PartController implements IController {
    public path = "/part";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/list", authBearer, checkPermAPI("EDITOR"), this.listParts);
        this.router.post("/create", authBearer, checkPermAPI("EDITOR"), this.createPart);
    }

    private listParts = async (req: Request, res: Response) => {
        const allParts = await Part.findAll({
            include: [
                {
                    model: Card,
                    include: [
                        Sprint
                    ]
                }
            ]
        })
        
        allParts.forEach((x) => {
            const resultObject = x.toJSON() as (Part & {totalInSprint: number, totalCards: number});
            resultObject.totalInSprint = x.cards.filter(x => x.sprintId == req.wap.sprint.id).length;
            resultObject.totalCards = x.cards.length;
        });

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
        return res.status(200).send({
            message: "Success."
        });
    }

}

export default PartController;