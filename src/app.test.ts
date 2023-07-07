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
import { apiControllers } from "./apiControllers";
import Session from "./models/session";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import ConfigController from "./apiControllers/configController";

const app_test_router = express.Router();
const app_test = express();
const ada = new ADA();

async function checkDatabaseConnection_test() {
    try {
        await db.authenticate();
        if (!(await Config.checkFailSafe())) {
            console.warn("");
            console.warn("/!\\ WARNING: It seems like the TESTS is beeing runned on a non-fail-safed database.");
            console.warn("/!\\ TESTS will not run since this would require truncating all tables.");
            console.warn("/!\\ To remove the failsafe, connect to the database and add a TESTS_FAILSAFE_DISABLED row with a value of TRUE into the Configs table.");
            process.exit(1);
        }
        ada.sprint = null;
        ada.parts = null;
        ada.users = null;
        ada.sessions = null;
        ada.config = {
            SMTP_Host: null,
            SMTP_User: null,
            SMTP_Port: null,
            SMTP_Password: null,
            Default_Password: null,
            Hostname: null,
            UsingCustomGenerator: null,
            UnderMaintenance: null,
            ADAInstanceId: null
        }
        await db.sync({ force: true });
        await Config.create({
            name: "TESTS_FAILSAFE_DISABLED",
            value: "TRUE"
        })
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

app_test.get('/start_tests', async (req, res, next) => {
    await checkDatabaseConnection_test();
    req.ada = ada;
    return next();
}, ConfigController.refresh);

app_test_router.use(cors());
app_test_router.use(express.json());
app_test_router.use(express.urlencoded({ extended: true }));

app_test_router.use(async (req: Request, res: Response, next: NextFunction) => {
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

app_test_router.use(authIfPossibleElseContinue);
app_test_router.use(checkFirstAccount);
app_test_router.use(checkDefaultPassword);
app_test_router.use(checkMaintenance);
app_test_router.use(morgan('tiny'));

for (let controller of apiControllers) {
    app_test_router.use(controller.path, controller.router);
}

app_test_router.get('/health', (req, res) => {
    res.status(200).send();
})

app_test.use('/api', app_test_router)

export { app_test, checkDatabaseConnection_test }