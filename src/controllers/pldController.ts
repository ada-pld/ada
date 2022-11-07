import IController from "./controller";
import express, {Request, Response, text} from "express";
import { authUser } from "../middlewares/auth";
import Card from "../models/card";
import makePld from "../../pldGenerator";
import { Op } from "sequelize";
import User from "../models/user";
import Part from "../models/part";
import generatePLD, { requireImages } from "../defaultPldGenerator";
import { checkPerm } from "../middlewares/checkPerms";

class PLDController implements IController {
    public path = "/pld";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, checkPerm("EDITOR"), this.pld);
        this.router.post("/setImages", authUser, checkPerm("EDITOR"), this.setImages);
    }

    private async importGenerator(moduleName: string): Promise<any> {
        const imported = await import(moduleName);
        return imported;
    }

    private pld = async (req: Request, res: Response) => {
        return res.render("pld/pld", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user,
            requiredImages: requireImages,
        })
    }

    private setImages = async (req: Request, res: Response) => {
        console.log(req.body);
        return res.redirect("/pld");
    }

    private pldGen = async (req: Request, res: Response) => {
        const allCards = await Card.findAll({
            where: {
                idInSprint: {
                    [Op.ne]: -1
                },
                sprintId: req.wap.sprint.id
            },
            order: [['sprintId', 'ASC'], ['partId', 'ASC'], ['idInSprint', 'ASC']],
            include: [
                User,
                Part
            ]
        });
        let dd: any = null;
        if (req.wap.config.UsingCustomGenerator.value == "true") {
            try {
                dd = (await this.importGenerator("../../pldGenerator/custom")).default(allCards);
            } catch (e) {
                return res.redirect("/dashboard/?error=error_using_custom_generator");
            }
        } else {
            dd = generatePLD(allCards);
        }
        makePld(dd, {}, "./pldGenerator/generated/test.pdf");
        return res.redirect("/dashboard/?info=success");
    }
}

export default PLDController;