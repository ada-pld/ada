import IController from "../controllers/controller";
import express, {Request, Response} from "express";
import { checkPerm, checkPermAPI } from "../middlewares/checkPerms";
import { authBearer, authUser } from "../middlewares/auth";
import { checkMailTransporter, setupMailTransporter } from "../mails";
import Sprint from "../models/sprint";
import Part from "../models/part";
import User from "../models/user";
import Config from "../models/config";
import Session from "../models/session";

class ConfigController implements IController {
    public path = "/config";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authBearer, checkPermAPI("ADMIN"), this.show);
        this.router.get("/refresh", authBearer, checkPermAPI("ADMIN"), this.refresh);
        this.router.post("/edit", authBearer, checkPermAPI("ADMIN"), this.edit);
    }

    private show = async (req: Request, res: Response) => {
        if (!req.wap.config.UnderMaintenance.value || req.wap.config.UnderMaintenance.value != "true") {
            req.wap.config.UnderMaintenance.value = "false";
        }
        return res.status(200).send({
            config: req.wap.config,
            version: process.env.npm_package_version,
            isTransporter: checkMailTransporter()
        })
    }

    private edit = async (req: Request, res: Response) => {
        let allPromises = [];
        if (req.body.smtphost) {
            req.wap.config.SMTP_Host.value = req.body.smtphost;
            allPromises.push(req.wap.config.SMTP_Host.save());
        }
        if (req.body.smtpuser) {
            req.wap.config.SMTP_User.value = req.body.smtpuser;
            allPromises.push(await req.wap.config.SMTP_User.save());
        }
        if (req.body.smtpport) {
            req.wap.config.SMTP_Port.value = req.body.smtpport;
            allPromises.push(await req.wap.config.SMTP_Port.save());
        }
        if (req.body.smtppassword) {
            req.wap.config.SMTP_Password.value = req.body.smtppassword;
            allPromises.push(await req.wap.config.SMTP_Password.save());
        }
        if (req.body.hostname) {
            req.wap.config.Hostname.value = req.body.hostname;
            allPromises.push(await req.wap.config.Hostname.save());
        }
        if (req.body.defaultPassword) {
            req.wap.config.Default_Password.value = req.body.defaultPassword;
            allPromises.push(await req.wap.config.Default_Password.save());
        }
        if (req.body.underMaintenance) {
            req.wap.config.UnderMaintenance.value = req.body.underMaintenance;
            allPromises.push(await req.wap.config.UnderMaintenance.save());
        }
        await Promise.all(allPromises);
        await setupMailTransporter();
        return res.status(200).send({
            message: "Success."
        })
    }

    private refresh = async (req: Request, res: Response) => {
        const wap = req.wap;
        const [parts, users, sessions, sprint, SMTP_Host, SMTP_User,
        SMTP_Port, SMTP_Password, Default_Password, Hostname,
        UsingCustomGenerator, UnderMaintenance] = await Promise.all([
            Part.findAll(),
            User.findAll(),
            Session.findAll(),
            Sprint.findOne({
                where: {
                    active: true
                }
            }),
            Config.getSMTPHost(),
            Config.getSMTPUser(),
            Config.getSMTPPort(),
            Config.getSMTPPassword(),
            Config.getDefaultPassword(),
            Config.getHostname(),
            Config.getUsingCustomGenerator(),
            Config.getUnderMaintenance()
        ]);
        wap.config.SMTP_Host = SMTP_Host
        wap.config.SMTP_User = SMTP_User
        wap.config.SMTP_Port = SMTP_Port
        wap.config.SMTP_Password = SMTP_Password
        wap.config.Default_Password = Default_Password
        wap.config.Hostname = Hostname
        wap.config.UsingCustomGenerator = UsingCustomGenerator
        wap.config.UnderMaintenance = UnderMaintenance
        wap.sprint = sprint;
        wap.parts = parts;
        wap.users = users;
        wap.sessions = sessions;
        await setupMailTransporter();
        
        return res.status(200).send({
            message: "Success."
        })
    }
}

export default ConfigController;
