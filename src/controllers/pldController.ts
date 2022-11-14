import IController from "./controller";
import express, {NextFunction, Request, Response, text} from "express";
import { authUser } from "../middlewares/auth";
import Card from "../models/card";
import makePld from "../../pldGenerator";
import { Op } from "sequelize";
import User from "../models/user";
import Part from "../models/part";
import { checkPerm } from "../middlewares/checkPerms";
import multer, { MulterError } from "multer";
import { renameSync, rmSync } from "fs";
import { writeFileSync, readFileSync } from "fs";
import { rgb, degrees, PDFDocument } from "pdf-lib";
import Sprint from "../models/sprint";

class PLDController implements IController {
    public path = "/pld";
    public router = express.Router();
    private importedGenerator : {
        generatePld: Function,
        requireImages: string[]
    } = {
        generatePld: null,
        requireImages: null
    };

    private upload = multer({
        dest: "tmp_uploads/",
        fileFilter(req, file, callback) {
            if (file.mimetype == "image/jpeg" && (req.baseUrl + req.path == '/pld/setImages'))
                return callback(null, true);
            if (file.mimetype == "image/png" && (req.baseUrl + req.path == '/pld/setImages'))
                return callback(null, true);
            if ((file.mimetype == "text/javascript" || file.mimetype == "application/x-javascript") && (req.baseUrl + req.path == '/pld/setGenerator'))
                return callback(null, true);
            callback(new Error("Invalid file: " + file.mimetype));
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
        this.router.post("/setGenerator", authUser, checkPerm("EDITOR"), this.setGeneratorPOST);
        this.router.get("/setImages", authUser, checkPerm("EDITOR"), this.importGenerator, this.setImagesGET);
        this.router.post("/setImages", authUser, checkPerm("EDITOR"), this.importGenerator, this.setImagesPOST);
    }

    private pld = async (req: Request, res: Response) => {
        return res.redirect("/pld/setGenerator");
    }

    private importGenerator = async (req: Request, res: Response, next: NextFunction) => {
        const imported = await import("../../pldGenerator/custom");
        if (!imported.getGenerator || !imported.getRequired)
            return res.redirect("/pld/setGenerator/?error=invalid_or_missing_generator");
        try {
            this.importedGenerator.generatePld = imported.default.getGenerator();
            this.importedGenerator.requireImages = imported.default.getRequired();
        } catch (ex) {
            console.log(ex);
            return res.redirect("/pld/setGenerator/?error=invalid_generator");
        }
        next();
    }

    private checkAssets = async (req: Request, res: Response, next: NextFunction) => {

    }

    private setGeneratorGET = async (req: Request, res: Response) => {
        let actualCode = "No custom generator.";
        let generatorExist = false
        try {
            actualCode = readFileSync("pldGenerator/custom/customGenerator/customPldGenerator.js").toString();
            generatorExist = true
        } catch (e) {}
        return res.render("pld/set_generator", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user,
            actualCode: actualCode,
            generatorExist: generatorExist
        })
    }

    private setGeneratorPOST = async (req: Request, res: Response) => {
        this.upload.single("generator.js")(req, res, async function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/pld/setGenerator?error=invalid_file_type");
            }
            if (req.file) {
                renameSync(req.file.path, "pldGenerator/custom/customGenerator/customPldGenerator.js");
            }
            return res.redirect("/pld/setImages");
        })
    }

    private setImagesGET = async (req: Request, res: Response) => {
        return this.pldGen(req, res);
        /*return res.render("pld/set_images", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user,
            requiredImages: this.importedGenerator.requireImages,
        })*/
    }

    private setImagesPOST = async (req: Request, res: Response) => {
        const requireImages = this.importedGenerator.requireImages;
        const fields = requireImages.map(x => { return { name: x, maxCount: 1} });
        const filesMiddleware = this.upload.fields(fields);
        filesMiddleware(req, res, async function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/pld/setImages?error=invalid_file_type");
            }
            for (const required of requireImages) {
                if (req.files[required]) {
                    renameSync(req.files[required].path, "pldGenerator/assets/" + req.files[required]);
                }
            }
            // TODO: redirect to a summary page before generating preview
            return res.redirect("/pld/setImages?info=succes");
        })
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
                Part,
                Sprint
            ]
        });
        console.log(this.importedGenerator.generatePld);
        const dd = this.importedGenerator.generatePld(allCards);
        await makePld(dd, {}, "./pldGenerator/generated/test.pdf");

        // Watermarking
        const document = await PDFDocument.load(readFileSync("./pldGenerator/generated/test.pdf"));
        const pages = document.getPages();
        for (const page of pages) {
            const { width, height } = page.getSize();
            page.drawText("SREVIEW", {
                x: (width / 2) - 200,
                y: (height / 2) - 750,
                size: 150,
                color: rgb(0.86, 0.21, 0.27),
                rotate: degrees(45),
                opacity: 0.1
            })
            page.drawText("PREVIEW", {
                x: (width / 2) - 200,
                y: (height / 2) - 325,
                size: 150,
                color: rgb(0.86, 0.21, 0.27),
                rotate: degrees(45),
                opacity: 0.1
            })
            page.drawText("PREVIEW", {
                x: (width / 2) - 200,
                y: (height / 2) + 100,
                size: 150,
                color: rgb(0.86, 0.21, 0.27),
                rotate: degrees(45),
                opacity: 0.1
            })
        }
        writeFileSync("./pldGenerator/generated/test.pdf", await document.save());

        // Success
        return res.redirect("/dashboard/?info=success");
    }
}

export default PLDController;