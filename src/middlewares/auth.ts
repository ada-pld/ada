import { Request, Response, NextFunction } from "express";
import User from "../models/user";

export const checkDefaultPassword = async function (req: Request, res: Response, next: NextFunction) {
    return next();
    if (!req.user && req.session.user) {
        const user = await User.findOne({
            where: {
                id: req.session.user
            }
        });
        req.user = user;
    }
    if (req.user && req.user.isDefaultPassword) {
        if (req.baseUrl + req.path == '/users/changeDefaultPassword')
            return next();
        return res.redirect("/users/changeDefaultPassword");
    }
    next();
}

export const authBearer = async function (req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send({
            message: "No token provided."
        });
    }
    const session = req.wap.sessions.find(x => x.accessToken == token);
    if (!session) {
        return res.status(401).send({
            message: "Invalid token."
        });
    }
    const user = await User.findOne({
        where: {
            id: session.userId
        }
    });
    if (!user) {
        return res.status(401).send({
            message: "Invalid session."
        })
    }
    req.user = user;
    next();
}