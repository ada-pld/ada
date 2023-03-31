import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import db from "./models";
import User from "./models/user";
import WAP from "./WAP";
import Sprint from "./models/sprint";
import Part from "./models/part";
import { checkDefaultPassword } from "./middlewares/auth";
import Config from "./models/config";
import { setupMailTransporter } from "./mails";
import { checkMaintenance } from "./middlewares/maintenance";
import { apiControllers } from "./apiControllers";
import Session from "./models/session";
import cors from "cors";
import path from "path";
import morgan from "morgan";

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

for (let controller of apiControllers) {
    api.use(controller.path, controller.router);
}

morgan.token('username', function getUsername(req: Request, res: Response) {
    return req.user ? (` [${req.user.firstname} ${req.user.lastname}]`) : "";
})
api.use(morgan(':method :url:username :status :res[content-length] - :response-time ms'))

next.use("/api", api);
next.use("/pldAssets", express.static("pldGenerator/assets"));
next.use("/pldGenerated", express.static("pldGenerator/generated"));
next.use(express.static('public2/'));
next.use((req, res) => {
    res.status(404);
    return res.sendFile(path.join(__dirname, '../public2/404/index.html'));
})

export { next as app, api, checkDatabaseConnection, closeDatabaseConnection, wap }