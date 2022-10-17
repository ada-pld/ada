import IController from "./controller";
import express, {Request, Response} from "express";
import { authUser } from "../middlewares/auth";

class RDVController implements IController {
    public path = "/rdv";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, this.rdv);
    }

    private rdv = (req: Request, res: Response) => {
        return res.redirect("/dashboard/?error=not_done_yet");
    }
}

export default RDVController;