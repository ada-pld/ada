import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import db from "./models";
import User from "./models/user";
import ADA from "./ADA";
import Sprint from "./models/sprint";
import Part from "./models/part";
import { authIfPossibleElseContinue, checkDefaultPassword, checkFirstAccount } from "./middlewares/auth";
import Config from "./models/config";
import { setupMailTransporter } from "./mails";
import { checkMaintenance } from "./middlewares/maintenance";
import { controllers } from "./controllers";
import Session from "./models/session";
import cors from "cors";
import path from "path";
import morgan from "morgan";

const api = express();
const next = express();
const ada = new ADA();

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
    if (ada.sprint == null) {
        const sprint = await Sprint.findOne({
            where: {
                active: true
            }
        })
        ada.sprint = sprint;
    }
    if (ada.parts == null) {
        const parts = await Part.findAll();
        ada.parts = parts;
    }
    if (ada.users == null) {
        const users = await User.findAll();
        ada.users = users;
    }
    if (ada.sessions == null) {
        const sessions = await Session.findAll();
        ada.sessions = sessions;
    }
    if (ada.config.SMTP_Host == null) {
        ada.config.SMTP_Host = await Config.getSMTPHost();
        ada.config.SMTP_User = await Config.getSMTPUser();
        ada.config.SMTP_Port = await Config.getSMTPPort();
        ada.config.SMTP_Password = await Config.getSMTPPassword();
        ada.config.Default_Password = await Config.getDefaultPassword();
        ada.config.Hostname = await Config.getHostname();
        ada.config.UsingCustomGenerator = await Config.getUsingCustomGenerator();
        ada.config.UnderMaintenance = await Config.getUnderMaintenance();
        await setupMailTransporter();
    }
    req.ada = ada;

    next();
})

api.use(authIfPossibleElseContinue);
api.use(checkFirstAccount);
api.use(checkDefaultPassword);
api.use(checkMaintenance);
api.use(morgan('tiny'))

for (let controller of controllers) {
    api.use(controller.path, controller.router);
}

api.get('/health', (req, res) => {
    res.status(200).send();
})

next.use("/api", api);
next.use("/pldAssets", express.static("pldGenerator/assets"));
next.use("/pldGenerated", express.static("pldGenerator/generated"));
next.use(express.static('public2/'));
next.use((req, res) => {
    res.status(404);
    return res.sendFile(path.join(__dirname, '../public2/404/index.html'));
})

export { next as app, api, checkDatabaseConnection, closeDatabaseConnection, ada }