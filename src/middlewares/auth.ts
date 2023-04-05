import { Request, Response, NextFunction } from "express";
import User from "../models/user";

export const checkFirstAccount = async function (req: Request, res: Response, next: NextFunction) {
    if ((await User.count()) == 0) {
        if ((req.baseUrl + req.path).startsWith("/api/users/createDefault")) {
            return next();
        }
        return res.status(424).send({
            message: "noAdminAccount"
        });
    }
    next();
}

export const checkDefaultPassword = async function (req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
        return next();
    } else if (req.user.isDefaultPassword) {
        if ((req.baseUrl + req.path).startsWith("/api/users/edit")
        || (req.baseUrl + req.path).startsWith("/api/users/forgotPassword")) {
            return next();
        }
        return res.status(424).send({
            message: "defaultPassword"
        });
    }
    next();
}

export const authIfPossibleElseContinue = async function (req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next();
    }
    const session = req.wap.sessions.find(x => x.accessToken == token);
    if (!session) {
        return next();
    }
    const user = await User.findOne({
        where: {
            id: session.userId
        }
    });
    if (!user) {
        return next();
    }
    req.user = user;
    next();
}

export const authBearer = async function (req: Request, res: Response, next: NextFunction) {
    if (req.user) {
        next();
    }
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