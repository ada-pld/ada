import IController from "../controllers/controller";
import AuthController from "./authController";
import ConfigController from "./configController";
import PartController from "./partsController";
import RendezVousController from "./rendezVousController";
import UserController from "./usersController";

export const apiControllers :IController[] = [
    new AuthController(),
    new UserController(),
    new PartController(),
    new ConfigController(),
    new RendezVousController(),
]