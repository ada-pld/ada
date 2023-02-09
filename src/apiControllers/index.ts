import IController from "../controllers/controller";
import AuthController from "./authController";
import PartController from "./partsController";
import UserController from "./usersController";

export const apiControllers :IController[] = [
    new AuthController(),
    new UserController(),
    new PartController()
]