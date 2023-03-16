import IController from "../controllers/controller";
import express, {Request, Response} from "express";
import { checkPerm, checkPermAPI } from "../middlewares/checkPerms";
import { authBearer, authUser } from "../middlewares/auth";
import Part from "../models/part";
import Card from "../models/card";
import Sprint from "../models/sprint";
import User from "../models/user";

class PollingController implements IController {
    public path = "/polling";
    public router = express.Router();

    static pollList: Map<string, Set<string>> = new Map<string, Set<string>>();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/poll", this.poll);
    }

    public static addToPollList(toRefresh: string) {
        this.pollList.forEach((v, k) => {
            v.add(toRefresh);
        })
    }

    private poll = async (req: Request, res: Response) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(200).send();
        }
        const session = req.wap.sessions.find(x => token && (x.accessToken == token));
        if (!session) {
            return res.status(401).send({
                message: "Invalid token."
            });
        }
        const user = await User.findOne({
            where: {
                id: session.userId
            }
        })
        if (!user) {
            return res.status(401).send({
                message: "Invalid session."
            })
        }
        const pollList = PollingController.pollList.get(user.id);
        if (!pollList) {
            PollingController.pollList.set(user.id, new Set<string>());
            return res.status(204).send();
        }
        pollList.clear()
        return res.status(200).send(pollList);
    }

}

export default PollingController;