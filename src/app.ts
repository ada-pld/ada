import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import db from "./models";
import User from "./models/user";
import session from "express-session";
import LoginController from "./controllers/loginController";
import IController from "./controllers/controller";
import LogoutController from "./controllers/logoutController";
import DashboardController from "./controllers/dashboardController";
import UserController from "./controllers/usersController";
import SprintController from "./controllers/sprintController";
import WAP from "./WAP";
import Sprint from "./models/sprint";
import PartsController from "./controllers/partsController";
import Part from "./models/part";
import PLDController from "./controllers/pldController";
import CardsController from "./controllers/cardsController";
import { authUser, checkDefaultPassword } from "./middlewares/auth";
import MycardsController from "./controllers/mycardsController";
import Config from "./models/config";
import ConfigController from "./controllers/configController";
import { setupMailTransporter } from "./mails";
import { checkMaintenance } from "./middlewares/maintenance";
import RendezVousController from "./controllers/rendezVousController";
import { apiControllers } from "./apiControllers";
import Session from "./models/session";
import cors from "cors";
import path from "path";
import fs from "fs";
import { sendEvents } from "./utils/utils";

const api = express();
const next = express();
const wap = new WAP();

async function checkDatabaseConnection() {
    try {
        await db.authenticate();
        await db.sync(/*{ force: true }*/);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function closeDatabaseConnection() {
    try {
        db.close()
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

api.use(cors());
api.use(express.json());
api.use(express.urlencoded({ extended: true }));
api.use(session({
    secret: "SessionSecret",
    cookie: {
        maxAge: 60000*60*60*24
    }
}))

api.use(async (req: Request, res: Response, next: NextFunction) => {
    if (wap.sprint == null) {
        const sprint = await Sprint.findOne({
            where: {
                active: true
            }
        })
        wap.sprint = sprint;
    }
    if (wap.parts == null) {
        const parts = await Part.findAll();
        wap.parts = parts;
    }
    if (wap.users == null) {
        const users = await User.findAll();
        wap.users = users;
    }
    if (wap.sessions == null) {
        const sessions = await Session.findAll();
        wap.sessions = sessions;
    }
    if (wap.config.SMTP_Host == null) {
        wap.config.SMTP_Host = await Config.getSMTPHost();
        wap.config.SMTP_User = await Config.getSMTPUser();
        wap.config.SMTP_Port = await Config.getSMTPPort();
        wap.config.SMTP_Password = await Config.getSMTPPassword();
        wap.config.Default_Password = await Config.getDefaultPassword();
        wap.config.Hostname = await Config.getHostname();
        wap.config.UsingCustomGenerator = await Config.getUsingCustomGenerator();
        wap.config.UnderMaintenance = await Config.getUnderMaintenance();
        await setupMailTransporter();
    }
    req.wap = wap;

    next();
})

api.use(checkDefaultPassword);
api.use(checkMaintenance);

const controllers : IController[] = [
    new LoginController(),
    new LogoutController(),
    new DashboardController(),
    new UserController(),
    new SprintController(),
    new PartsController(),
    new RendezVousController(),
    new PLDController(),
    new CardsController(),
    new MycardsController(),
    new ConfigController(),
];

for (let controller of apiControllers) {
    api.use(controller.path, controller.router);
}

api.get("/makeItCrash", async (req, res) => {
    await new Promise((r, e) => {
        e(0)
    });
})

next.use("/api", api);
next.use("/pldAssets", express.static("pldGenerator/assets"));
next.use("/pldGenerated", express.static("pldGenerator/generated"));
next.use(express.static('public2/'));
next.use((req, res) => {
    res.status(404);
    return res.sendFile(path.join(__dirname, '../public2/404/index.html'));
})

export { next as app, api, checkDatabaseConnection, closeDatabaseConnection, wap }