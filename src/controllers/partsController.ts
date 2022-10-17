import IController from "./controller";
import express, {Request, Response} from "express";
import { checkPerm } from "../middlewares/checkPerms";
import { authUser } from "../middlewares/auth";
import Part from "../models/part";

class PartsController implements IController {
    public path = "/parts";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, checkPerm("EDITOR"), this.getParts);
        this.router.get("/create", authUser, checkPerm("EDITOR"), this.createPartsGET);
        this.router.post("/create", authUser, checkPerm("EDITOR"), this.createPartsPOST);
    }

    private getParts = async (req: Request, res: Response) => {
        const allParts = req.wap.parts;

        return res.render("parts/parts", {
            currentPage: '/parts',
            wap: req.wap,
            user: req.user,
            allParts: allParts
        })
    }

    private createPartsGET = async (req: Request, res: Response) => {
        return res.render("parts/create_parts", {
            currentPage: '/parts',
            wap: req.wap,
            user: req.user
        });
    }

    private createPartsPOST = async (req: Request, res: Response) => {
        if (!req.body.name)
            return res.redirect("/parts/create?error=invalid_body");
        const alreadyExists = await Part.findOne({
            where: {
                name: req.body.name
            }
        })
        if (alreadyExists)
            return res.redirect("/parts/create?error=already_exists");
        await Part.create({
            name: req.body.name,
        });
        req.wap.parts = await Part.findAll();
        return res.redirect("/parts/?info=success");
    }

}

export default PartsController;