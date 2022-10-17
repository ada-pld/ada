import IController from "./controller";
import express, { Request, Response } from "express";
import User from "../models/user";
import * as bcrypt from "bcrypt";

class LoginController implements IController {
    public path = "/login";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", this.getlogin);
        this.router.post("/", this.postlogin);
    }

    private getlogin = async (req: Request, res: Response) => {
        if (req.user)
            return res.redirect("/dashboard");
        return res.render("login/login", {
            wap: req.wap,
            user: null,
            error: null
        });
    }

    private postlogin = async (req: Request, res: Response) => {
        if (req.user)
            return res.redirect("/dashboard");
        if (!req.body.email || !req.body.password) {
            return res.render("login/login", {
                wap: req.wap,
                user: null,
                error: "Missing email or password."
            });
        }
        const user = await User.findOne({
            where: {
                email: req.body.email
            }
        });
        const salted = process.env.PASS_SALT + req.body.password;
        if (!user || !(await bcrypt.compare(salted, user.password))) {
            return res.render("login/login", {
                wap: req.wap,
                user: null,
                error: "Invalid email or password"
            });
        }
        req.session.user = user.id;
        req.session.save(() => {
            return res.redirect("/dashboard");
        });
    }
}

export default LoginController;