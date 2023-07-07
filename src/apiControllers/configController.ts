import IController from "./controller";
import express, {Request, Response} from "express";
import { checkPermAPI } from "../middlewares/checkPerms";
import { authBearer } from "../middlewares/auth";
import { checkMailTransporter, setupMailTransporter } from "../mails";
import Sprint from "../models/sprint";
import Part from "../models/part";
import User from "../models/user";
import Config from "../models/config";
import Session from "../models/session";
import PollingController from "./pollingController";

class ConfigController implements IController {
    public path = "/config";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authBearer, checkPermAPI("ADMIN"), this.show);
        this.router.get("/refresh", authBearer, checkPermAPI("ADMIN"), ConfigController.refresh);
        this.router.post("/edit", authBearer, checkPermAPI("ADMIN"), this.edit);
    }

    private show = async (req: Request, res: Response) => {
        if (!req.ada.config.UnderMaintenance.value || req.ada.config.UnderMaintenance.value != "true") {
            req.ada.config.UnderMaintenance.value = "false";
        }
        return res.status(200).send({
            config: req.ada.config,
            version: process.env.npm_package_version,
            isTransporter: checkMailTransporter()
        })
    }

    private edit = async (req: Request, res: Response) => {
        let allPromises = [];
        if (req.body.smtphost) {
            req.ada.config.SMTP_Host.value = req.body.smtphost;
            allPromises.push(req.ada.config.SMTP_Host.save());
        }
        if (req.body.smtpuser) {
            req.ada.config.SMTP_User.value = req.body.smtpuser;
            allPromises.push(await req.ada.config.SMTP_User.save());
        }
        if (req.body.smtpport) {
            req.ada.config.SMTP_Port.value = req.body.smtpport;
            allPromises.push(await req.ada.config.SMTP_Port.save());
        }
        if (req.body.smtppassword) {
            req.ada.config.SMTP_Password.value = req.body.smtppassword;
            allPromises.push(await req.ada.config.SMTP_Password.save());
        }
        if (req.body.hostname) {
            req.ada.config.Hostname.value = req.body.hostname;
            allPromises.push(await req.ada.config.Hostname.save());
        }
        if (req.body.defaultPassword) {
            req.ada.config.Default_Password.value = req.body.defaultPassword;
            allPromises.push(await req.ada.config.Default_Password.save());
        }
        if (req.body.underMaintenance) {
            req.ada.config.UnderMaintenance.value = req.body.underMaintenance;
            allPromises.push(await req.ada.config.UnderMaintenance.save());
        }
        await Promise.all(allPromises);
        await setupMailTransporter();
        PollingController.addToPollList('useGetConfigQuery');
        return res.status(200).send({
            message: "Success."
        })
    }

    static refresh = async (req: Request, res: Response) => {
        const ada = req.ada;
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
        ada.config.SMTP_Host = SMTP_Host
        ada.config.SMTP_User = SMTP_User
        ada.config.SMTP_Port = SMTP_Port
        ada.config.SMTP_Password = SMTP_Password
        ada.config.Default_Password = Default_Password
        ada.config.Hostname = Hostname
        ada.config.UsingCustomGenerator = UsingCustomGenerator
        ada.config.UnderMaintenance = UnderMaintenance
        ada.sprint = sprint;
        ada.parts = parts;
        ada.users = users;
        ada.sessions = sessions;
        await setupMailTransporter();
        
        return res.status(200).send({
            message: "Success."
        })
    }
}

export default ConfigController;