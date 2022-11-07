import IController from "./controller";
import express, {Request, Response, text} from "express";
import { authUser } from "../middlewares/auth";
import Card from "../models/card";
import makePld from "../../pldGenerator";
import { Op } from "sequelize";
import User from "../models/user";
import Part from "../models/part";
import generatePLD, { requireImages } from "../defaultPldGenerator";
import { checkPerm } from "../middlewares/checkPerms";
import multer, { MulterError } from "multer";
import { renameSync } from "fs";

class PLDController implements IController {
    public path = "/pld";
    public router = express.Router();
    private importedGenerator = null;
    private upload = multer({
        dest: "tmp_uploads/",
        fileFilter(req, file, callback) {
            if (file.mimetype == "image/jpeg" && (req.baseUrl + req.path == '/pld/setImages'))
                return callback(null, true);
            if (file.mimetype == "image/png" && (req.baseUrl + req.path == '/pld/setImages'))
                return callback(null, true);
            if (file.mimetype == "text/javascript" && (req.baseUrl + req.path == '/pld/setGenerator'))
            callback(new Error("Invalid file"));
        },
        limits: {
            fileSize: 10 * 1000 * 1000 // 10 MB
        }
    })

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, checkPerm("EDITOR"), this.pld);
        this.router.get("/setGenerator", authUser, checkPerm("EDITOR"), this.setGeneratorGET);
        this.router.get("/setGenerator", authUser, checkPerm("EDITOR"), this.setGeneratorPOST);
        this.router.get("/setImages", authUser, checkPerm("EDITOR"), this.setImagesGET);
        this.router.post("/setImages", authUser, checkPerm("EDITOR"), this.setImagesPOST);
    }

    private async importGenerator(moduleName: string): Promise<any> {
        this.importedGenerator = await import(moduleName);
        return this.importedGenerator;
    }

    private pld = async (req: Request, res: Response) => {
        return res.redirect("/pld/setGenerator");
    }

    private setGeneratorGET = async (req: Request, res: Response) => {
        return res.render("pld/set_generator", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user,
            requiredImages: requireImages,
        })
    }

    private setGeneratorPOST = async (req: Request, res: Response) => {
        this.upload.single("generator.js")(req, res, async function (err) {
            if (err) {
                console.log(err);
                return;
            }
            renameSync(req.file.path, "pldGenerator/customGenerator/customPldGenerator.js");
            return res.redirect("/pld/setImages");
        })
    }

    private setImagesGET = async (req: Request, res: Response) => {
        try {
            const test = await this.importGenerator("../../pldGenerator/custom");
            if (!test.default || ! test.requireImages) {
                return res.redirect("/pld/setGenerator?error=invalid_generator");
            }
        } catch (err) {
            return res.redirect("/pld/setGenerator?error=invalid_or_missing_generator");
        }
        return res.render("pld/set_images", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user,
            requiredImages: requireImages,
        })
    }

    private setImagesPOST = async (req: Request, res: Response) => {
        try {
            const test = await this.importGenerator("../../pldGenerator/custom");
            if (!test.default || ! test.requireImages) {
                return res.redirect("/pld/setGenerator?error=invalid_generator");
            }
        } catch (err) {
            return res.redirect("/pld/setGenerator?error=invalid_or_missing_generator");
        }

        const fields = requireImages.map(x => { return { name: x, maxCount: 1} });
        const filesMiddleware = this.upload.fields(fields);
        filesMiddleware(req, res, async function (err) {
            if (err) {
                console.log(err);
                return;
            }
            for (const required of requireImages) {
                if (req.files[required]) {
                    renameSync(req.files[required].path, "pldGenerator/assets/" + req.files[required]);
                }
            }
        })
        return res.redirect("/pld");
    }

    private pldGen = async (req: Request, res: Response) => {
        const allCards = await Card.findAll({
            where: {
                idInSprint: {
                    [Op.ne]: -1
                },
                sprintId: req.wap.sprint.id
            },
            order: [['sprintId', 'ASC'], ['partId', 'ASC'], ['idInSprint', 'ASC']],
            include: [
                User,
                Part
            ]
        });
        let dd: any = null;
        if (req.wap.config.UsingCustomGenerator.value == "true") {
            try {
                dd = (await this.importGenerator("../../pldGenerator/custom")).default(allCards);
            } catch (e) {
                return res.redirect("/dashboard/?error=error_using_custom_generator");
            }
        } else {
            dd = generatePLD(allCards);
        }
        makePld(dd, {}, "./pldGenerator/generated/test.pdf");
        return res.redirect("/dashboard/?info=success");
    }
}

export default PLDController;