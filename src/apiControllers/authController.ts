import IController from "./controller";
import express, { Request, Response } from "express";
import User from "../models/user";
import * as bcrypt from "bcrypt";
import { generateRandomString } from "../utils/utils";
import Session from "../models/session";

class AuthController implements IController {
    public path = "/auth";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post("/login", this.login);
        this.router.get("/refreshToken", this.refreshToken);
        this.router.get("/logout", this.logout);
        this.router.get("/checkToken", this.checkToken);
    }

    private login = async (req: Request, res: Response) => {
        if (!req.body.email || !req.body.password) {
            return res.status(400).send({
                message: "Missing credentials."
            })
        }
        const user = await User.findOne({
            where: {
                email: req.body.email
            }
        });

        if (!user) {
            await bcrypt.compare("nothing", "issecure");
            return res.status(401).send({
                message: "Invalid credentials."
            });
        }
        if (!(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(401).send({
                message: "Invalid credentials."
            });
        }
        const [accessToken, refreshToken] = await Promise.all([
            generateRandomString(48), generateRandomString(48)
        ])
        let roleId = 0;
        switch (user.role) {
            case "ADMIN":
                roleId = 3;
                break;
            case "EDITOR":
                roleId = 2;
                break;
            case "MAINTENER":
                roleId = 1;
                break;
            default:
                roleId = 0;
        }
        const date = Math.floor(new Date().getTime() / 1000);
        await Session.create({
            userId: user.id,
            accessToken: roleId + accessToken.substring(1),
            refreshToken: refreshToken,
            accessTokenExpires: (date + (1 * 60 * 15)),
            refreshTokenExpires: (date + (1 * 60 * 60 * 24)),
        });

        req.ada.sessions = await Session.findAll();

        return res.status(200).send({
            userId: user.id,
            accessToken: roleId + accessToken.substring(1),
            refreshToken: refreshToken
        });
    }

    private refreshToken = async (req: Request, res: Response) => {
        if (!req.query.refreshToken || !req.query.userId) {
            return res.status(400).send({
                message: "Invalid refreshToken or UserId"
            });
        }
        const session = req.ada.sessions.find(x => (x.refreshToken == req.query.refreshToken) && (x.userId == req.query.userId));
        if (!session) {
            return res.status(400).send({
                message: "Invalid refreshToken or userId"
            });
        }
        const date = Math.floor(new Date().getTime() / 1000);

        if (date > session.refreshTokenExpires) {
            return res.status(401).send({
                message: "Refresh token expired."
            });
        }

        const [accessToken, refreshToken] = await Promise.all([
            generateRandomString(48), generateRandomString(48)
        ])
        const roleId = session.accessToken.at(0);

        session.accessToken = roleId + accessToken.substring(1);
        session.refreshToken = refreshToken;
        session.accessTokenExpires = date + (1 * 60 * 15);
        session.refreshTokenExpires = date + (1 * 60 * 60 * 24);
        await session.save();

        req.ada.sessions = await Session.findAll();

        return res.status(200).send({
            accessToken: roleId + accessToken.substring(1),
            refreshToken: refreshToken
        })
    }

    private logout = async (req: Request, res: Response) => {
        if (!req.query.token) {
            return res.status(400).send({
                message: "No token provided"
            });
        }
        const session = req.ada.sessions.find(x => x.accessToken == req.query.token);
        if (!session) {
            return res.status(400).send({
                message: "Invalid token"
            });
        }
        
        await Session.destroy({
            where: {
                accessToken: req.query.token as string
            }
        });

        req.ada.sessions = await Session.findAll();

        return res.status(200).send({
            message: "Logout complete."
        });
    }

    private checkToken = async (req: Request, res: Response) => {
        if (!req.query.token) {
            return res.status(400).send({
                message: "No token provided"
            });
        }
        const session = req.ada.sessions.find(x => x.accessToken == req.query.token);
        if (!session) {
            return res.status(400).send({
                message: "Invalid token"
            });
        }
        const date = Math.floor(new Date().getTime() / 1000);
        if (date > session.accessTokenExpires) {
            return res.status(401).send({
                message: "Access token expired."
            });
        }
        
        return res.status(200).send({
            message: "Valid token."
        });
    }

}

export default AuthController;