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
import RDVController from "./controllers/rdvController";
import PLDController from "./controllers/pldController";
import CardsController from "./controllers/cardsController";
import { authUser, checkDefaultPassword } from "./middlewares/auth";
import MycardsController from "./controllers/mycardsController";
import Config from "./models/config";
import ConfigController from "./controllers/configController";
import { setupMailTransporter } from "./mails";
import { checkMaintenance } from "./middlewares/maintenance";

const app = express();
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

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "SessionSecret",
    cookie: {
        maxAge: 60000*60*60*24
    }
}))

app.use(async (req: Request, res: Response, next: NextFunction) => {
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

app.use(checkDefaultPassword);
app.use(checkMaintenance);

const controllers : IController[] = [
    new LoginController(),
    new LogoutController(),
    new DashboardController(),
    new UserController(),
    new SprintController(),
    new PartsController(),
    new RDVController(),
    new PLDController(),
    new CardsController(),
    new MycardsController(),
    new ConfigController(),
];
for (let controller of controllers) {
    app.use(controller.path, controller.router);
}

app.get('/', authUser, (req, res) => {
    return res.redirect("/dashboard");
})

app.use((req, res) => {
    res.status(404);
    return res.render("404", {
        user: req.user,
        wap: req.wap,
        currentPage: "404",
        url: req.url
    });
})

export { app, checkDatabaseConnection, wap }