import IController from "./controller";
import express, {Request, Response} from "express";
import { authUser } from "../middlewares/auth";

class RendezVousController implements IController {
    public path = "/rendezVous";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, this.rendezVous);
    }

    private rendezVous = (req: Request, res: Response) => {
        return res.render("rendezVous/rendezVous", {
            currentPage: '/rendezVous',
            wap: req.wap,
            user: req.user,
        })
    }
}

export default RendezVousController;