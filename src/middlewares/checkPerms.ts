import { Request, Response, NextFunction } from "express";
import { Role } from "../models/user";

export const checkPermAPI = function (permission: Role) {
    return async function(req: Request, res: Response, next: NextFunction) {
        if (req.user.role == "ADMIN") {
            return next();
        }
        if (req.user.role == "EDITOR") {
            if (permission == "EDITOR" || permission == "MAINTENER" || permission == "USER") {
                return next();
            }
        }
        if (req.user.role == "MAINTENER") {
            if (permission == "MAINTENER" || permission == "USER") {
                return next();
            }
        }
        if (req.user.role == "USER") {
            if (permission == "USER") {
                return next();
            }
        }
        return res.status(403).send({
            message: "You don't have access to this resource."
        })
    }
}