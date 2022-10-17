import { Request, Response, NextFunction } from "express";
import User, { Role } from "../models/user";

export const checkPerm = function (permission: Role) {
    return async function(req: Request, res: Response, next: NextFunction) {
        if (req.user.role == "ADMIN")
            return next();
        if (req.user.role == "EDITOR") {
            if (permission == "EDITOR" || permission == "MAINTENER" || permission == "USER")
                return next();
        }
        if (req.user.role == "MAINTENER") {
            if (permission == "MAINTENER" || permission == "USER")
                return next();
        }
        if (req.user.role == "USER") {
            if (permission == "USER")
                return next();
        }
        return res.redirect("/dashboard?error=no_permissions");
    }
}