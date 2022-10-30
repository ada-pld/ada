import { Request, Response, NextFunction } from "express";

export const checkMaintenance = async function (req: Request, res: Response, next: NextFunction) {
    if (req.baseUrl + req.path == '/login')
        return next();
    if (req.wap.config.UnderMaintenance.value == "true") {
        if (!req.user)
            return res.render("maintenance", {
                user: req.user,
                wap: req.wap,
                currentPage: "maintenance",
                url: req.url
            });
        if (req.user.role != "ADMIN")
            return res.render("maintenance", {
                user: req.user,
                wap: req.wap,
                currentPage: "maintenance",
                url: req.url
            });
        return next();
    }
    return next();
}