import IController from "./controller";
import express, { Request, Response } from "express";
import User from "../models/user";
import * as bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";

class LoginController implements IController {
    public path = "/login";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", this.getlogin);
        this.router.post("/", this.postlogin);
        this.router.post("/createDefaultAccount", this.postCreateDefaultAccount);
    }

    private getlogin = async (req: Request, res: Response) => {
        if (req.user)
            return res.redirect("/dashboard");
        const numberOfUsers = await User.count();
        if (numberOfUsers == 0) {
            return res.render("login/create_default_account", {
                wap: req.wap,
                user: null,
                error: null
            })
        }
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

    private postCreateDefaultAccount = [
        body("firstname").exists({ checkFalsy: true}),
        body("lastname").exists({ checkFalsy: true }),
        body("password").exists({ checkFalsy: true }),
        body("email").normalizeEmail().isEmail(),
        async (req: Request, res: Response) => {
            const numberOfUsers = await User.count();
            if (numberOfUsers != 0) {
                return res.render("404", {
                    user: req.user,
                    currentPage: "404",
                    url: req.url
                })
            }
            if (!validationResult(req).isEmpty()) {
                return res.redirect("/login?error=invalid_body");
            }
            const user = await User.create({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                password: await bcrypt.hash(process.env.PASS_SALT + req.body.password, 10),
                role: "ADMIN",
                isDefaultPassword: false
            });
            req.wap.users = await User.findAll();
            req.session.user = user.id;
            req.session.save(() => {
                return res.redirect("/dashboard");
            })
        }
    ]
}

export default LoginController;