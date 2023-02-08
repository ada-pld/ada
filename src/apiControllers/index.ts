import IController from "../controllers/controller";
import AuthController from "./authController";
import UserController from "./usersController";

export const apiControllers :IController[] = [
    new AuthController(),
    new UserController()
]