import IController from "./controller";
import AuthController from "./authController";
import CardController from "./cardController";
import ConfigController from "./configController";
import PartController from "./partController";
import PLDController from "./pldController";
import PollingController from "./pollingController";
import RendezVousController from "./rendezVousController";
import RendezVousGroupController from "./rendezVousGroupController";
import SprintController from "./sprintController";
import UserController from "./usersController";

export const controllers :IController[] = [
    new AuthController(),
    new UserController(),
    new PartController(),
    new ConfigController(),
    new RendezVousController(),
    new RendezVousGroupController(),
    new SprintController(),
    new CardController(),
    new PLDController(),
    new PollingController(),
]