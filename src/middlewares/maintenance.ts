import { Request, Response, NextFunction } from "express";

export const checkMaintenance = async function (req: Request, res: Response, next: NextFunction) {
    if ((req.baseUrl + req.path).startsWith("/api/auth"))
        return next();
    if (req.wap.config.UnderMaintenance.value == "true") {
        if (!req.user || req.user.role != "ADMIN") {
            return res.status(503).send();
        }
        return next();
    }
    return next();
}