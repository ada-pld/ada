import IController from "./controller";
import express, {Request, Response} from "express";

class LogoutController implements IController {
    public path = "/logout";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", this.logout);
    }

    private logout = (req: Request, res: Response) => {
        req.session.destroy(() => {
            res.redirect("/login");
        });
    }
}

export default LogoutController;