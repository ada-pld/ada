import IController from "./controller";
import express, {Request, Response} from "express";
import { authBearer } from "../middlewares/auth";
import { checkPermAPI } from "../middlewares/checkPerms";
import RendezVousGroup from "../models/rendezVousGroup";

class RendezVousGroupController implements IController {
    public path = "/rendezVousGroup";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/list", authBearer, checkPermAPI("MAINTENER"), this.list);
        this.router.get("/:id", authBearer, checkPermAPI("MAINTENER"), this.getOne);
    }

    private list = async (req: Request, res: Response) => {
        let rendezVousGroups = await RendezVousGroup.findAll();
        return res.status(200).send(rendezVousGroups);
    }

    private getOne = async (req: Request, res: Response) => {
        let rendezVousGroup = await RendezVousGroup.findAll({
            where: {
                id: req.params.id
            }
        });
        if (!rendezVousGroup) {
            return res.status(400).send({
                message: "Invalid id"
            });
        }
        return res.status(200).send(rendezVousGroup);
    }

}
export default RendezVousGroupController;