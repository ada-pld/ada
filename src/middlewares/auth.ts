import { Request, Response, NextFunction } from "express";
import User from "../models/user";

export const checkDefaultPassword = async function (req: Request, res: Response, next: NextFunction) {
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
    if (req.user.isDefaultPassword)
        return res.redirect("/user/changeDefaultPassword");
    next();
}