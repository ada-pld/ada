import IController from "./controller";
import express, {Request, Response} from "express";
import { checkPerm } from "../middlewares/checkPerms";
import { authUser } from "../middlewares/auth";
import { checkMailTransporter, setupMailTransporter } from "../mails";
import Sprint from "../models/sprint";
import Part from "../models/part";
import User from "../models/user";
import Config from "../models/config";

class ConfigController implements IController {
    public path = "/config";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, checkPerm("ADMIN"), this.showConfig);
        this.router.post("/", authUser, checkPerm("ADMIN"), this.postConfig);
        this.router.post("/refresh", authUser, checkPerm("ADMIN"), this.refreshCache);
    }

    private showConfig = async (req: Request, res: Response) => {
        return res.render("config/config", {
            currentPage: '/config',
            wap: req.wap,
            user: req.user,
            version: process.env.npm_package_version,
            isTransporter: checkMailTransporter()
        })
    }

    private postConfig = async (req: Request, res: Response) => {
        if (req.body.smtphost) {
            req.wap.config.SMTP_Host.value = req.body.smtphost;
            await req.wap.config.SMTP_Host.save();
        }
        if (req.body.smtpuser) {
            req.wap.config.SMTP_User.value = req.body.smtpuser;
            await req.wap.config.SMTP_User.save();
        }
        if (req.body.smtpport) {
            req.wap.config.SMTP_Port.value = req.body.smtpport;
            await req.wap.config.SMTP_Port.save();
        }
        if (req.body.smtppassword) {
            req.wap.config.SMTP_Password.value = req.body.smtppassword;
            await req.wap.config.SMTP_Password.save();
        }
        if (req.body.hostname) {
            req.wap.config.Hostname.value = req.body.hostname;
            await req.wap.config.Hostname.save();
        }
        if (req.body.defaultPassword) {
            req.wap.config.Default_Password.value = req.body.defaultPassword;
            await req.wap.config.Default_Password.save();
        }
        if (req.body.underMaintenance) {
            req.wap.config.UnderMaintenance.value = req.body.underMaintenance;
            await req.wap.config.UnderMaintenance.save();
        }
        await setupMailTransporter();
        return res.redirect("/config");
    }

    private refreshCache = async (req: Request, res: Response) => {
        const wap = req.wap;
        const parts = await Part.findAll();
        const users = await User.findAll();
        const sprint = await Sprint.findOne({
            where: {
                active: true
            }
        });
        wap.config.SMTP_Host = await Config.getSMTPHost();
        wap.config.SMTP_User = await Config.getSMTPUser();
        wap.config.SMTP_Port = await Config.getSMTPPort();
        wap.config.SMTP_Password = await Config.getSMTPPassword();
        wap.config.Default_Password = await Config.getDefaultPassword();
        wap.config.Hostname = await Config.getHostname();
        wap.config.UsingCustomGenerator = await Config.getUsingCustomGenerator();
        wap.config.UnderMaintenance = await Config.getUnderMaintenance();
        wap.sprint = sprint;
        wap.parts = parts;
        wap.users = users;
        await setupMailTransporter();
        return res.redirect("/config/?info=cache_refreshed");
    }
}

export default ConfigController;