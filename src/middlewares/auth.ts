import { Request, Response, NextFunction } from "express";
import User from "../models/user";

export const defaultAuth = async function (req: Request, res: Response, next: NextFunction) {
    if (req.user)
        return next();
    if (req.session.user) {
        const user = await User.findOne({
            where: {
                id: req.session.user
            }
        });
        req.user = user;
    }
    next();
}

export const authUser = async function (req: Request, res: Response, next: NextFunction) {
    if (req.user)
        return next();
    if (!req.session.user)
        return res.redirect("/login");
    const user = await User.findOne({
        where: {
            id: req.session.user
        }
    });
    req.user = user;
    if (!req.user)
        return res.redirect("/login");
    next();
}