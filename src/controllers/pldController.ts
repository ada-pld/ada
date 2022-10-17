import IController from "./controller";
import express, {Request, Response} from "express";
import { authUser } from "../middlewares/auth";

class PLDController implements IController {
    public path = "/pld";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, this.pld);
    }

    private pld = (req: Request, res: Response) => {
        return res.redirect("/dashboard/?error=not_done_yet");
    }
}

export default PLDController;