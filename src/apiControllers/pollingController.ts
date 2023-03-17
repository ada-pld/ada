import IController from "./controller";
import express, {Request, Response} from "express";
import uuid from 'uuid';

class PollingController implements IController {
    public path = "/polling";
    public router = express.Router();

    static pollList: Map<string, Set<string>> = new Map<string, Set<string>>();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/:id", this.poll);
    }

    public static addToPollList(toRefresh: string) {
        this.pollList.forEach((v, k) => {
            v.add(toRefresh);
        })
    }

    private poll = async (req: Request, res: Response) => {
        const uuidv4 = req.params.id || uuid.v4();
        if (!req.params.id) {
            PollingController.pollList.set(uuidv4, new Set<string>());
            return res.status(200).send(uuid.v4());
        }
        const pollList = PollingController.pollList.get(uuidv4);
        if (!pollList) {
            return res.status(400).send();
        }
        const cpy = new Set(pollList);
        pollList.clear()
        return res.status(200).send(cpy);
    }

}

export default PollingController;