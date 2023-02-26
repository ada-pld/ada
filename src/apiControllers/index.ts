import IController from "../controllers/controller";
import AuthController from "./authController";
import CardController from "./cardController";
import ConfigController from "./configController";
import PartController from "./partController";
import PLDController from "./pldController";
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
    new CardController(),
    new PLDController(),
]