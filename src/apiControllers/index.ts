import IController from "../controllers/controller";
import AuthController from "./authController";
import ConfigController from "./configController";
import PartController from "./partController";
import RendezVousController from "./rendezVousController";
import SprintController from "./sprintController";
import UserController from "./usersController";

export const apiControllers :IController[] = [
    new AuthController(),
    new UserController(),
    new PartController(),
    new ConfigController(),
    new RendezVousController(),
    new SprintController(),
]