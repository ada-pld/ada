import IController from "./controller";
import express, {NextFunction, Request, Response } from "express";
import { authBearer } from "../middlewares/auth";
import Card from "../models/card";
import makePld from "../../pldGenerator";
import { Op } from "sequelize";
import User from "../models/user";
import Part from "../models/part";
import { checkPermAPI } from "../middlewares/checkPerms";
import multer from "multer";
import { writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from "fs";
import { rgb, degrees, PDFDocument } from "pdf-lib";
import Sprint from "../models/sprint";
import PLD from "../models/pld";

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
    private lastPreview :any = null;
    private lastChangelog :any = null;

    private upload = multer({
        dest: "tmp_uploads/",
        fileFilter(req, file, callback) {
            if (file.mimetype == "image/jpeg" && (req.baseUrl + req.path == '/api/pld/images'))
                return callback(null, true);
            if (file.mimetype == "image/png" && (req.baseUrl + req.path == '/api/pld/images'))
                return callback(null, true);
            if ((file.mimetype == "text/javascript" || file.mimetype == "application/x-javascript") && (req.baseUrl + req.path == '/api/pld/generator'))
                return callback(null, true);
            callback(new Error("Invalid file: " + file.mimetype));
        },
        limits: {
            fileSize: 10 * 1000 * 1000 // 10 MB
        }
    })

    private importGenerator = async (req: Request, res: Response, next: NextFunction) => {
        const imported = await import("../../pldGenerator/custom");
        if (!imported.getGenerator || !imported.getRequired) {
            return res.status(400).send({
                message: "Invalid or missing generator."
            })
        }
        try {
            this.importedGenerator.generatePld = imported.default.getGenerator();
            this.importedGenerator.requireImages = imported.default.getRequired();
        } catch (ex) {
            console.error(ex);
            return res.status(400).send({
                message: "Invalid generator."
            })
        }
        next();
    }

    private checkAssets = async (req: Request, res: Response, next: NextFunction) => {
        const requiredImages = this.importedGenerator.requireImages;
        for (const image of requiredImages) {
            if (!existsSync("pldGenerator/assets/" + image)) {
                return res.status(400).send({
                    message: "Asset missing"
                })
            }
        }
        return next();
    }

    constructor() {
        try {
            mkdirSync("./pldGenerator/generated");
            mkdirSync("./pldGenerator/assets");
        } catch (e) {
            if (e.code !== "EEXIST") {
                throw e;
            }
        }
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/list", authBearer, checkPermAPI("MAINTENER"), this.list);
        this.router.get("/generator", authBearer, checkPermAPI("EDITOR"), this.getGenerator);
        this.router.post("/generator", authBearer, checkPermAPI("ADMIN"), this.setGenerator);
        this.router.get("/images", authBearer, checkPermAPI("EDITOR"), this.importGenerator, this.getImages);
        this.router.post("/images", authBearer, checkPermAPI("EDITOR"), this.importGenerator, this.setImages);
        this.router.get("/changes", authBearer, checkPermAPI("EDITOR"), this.importGenerator, this.checkAssets, this.getChanges);
        this.router.post("/changes", authBearer, checkPermAPI("EDITOR"), this.importGenerator, this.checkAssets, this.setChangesAndGeneratePreview);
        this.router.post("/generate", authBearer, checkPermAPI("EDITOR"), this.importGenerator, this.checkAssets, this.generate);
        this.router.get("/checkPreview", authBearer, checkPermAPI("EDITOR"), this.importGenerator, this.checkAssets, this.checkPreviewExists);
    }

    private list = async (req: Request, res: Response) => {
        const allPLDs = await PLD.findAll({
            include: [
                Sprint
            ]
        });

        return res.status(200).send(allPLDs);
    }

    private getGenerator = async (req: Request, res: Response) => {
        let actualCode = "No custom generator.";
        let generatorExist = false
        try {
            actualCode = readFileSync("pldGenerator/custom/customGenerator/customPldGenerator.js").toString();
            generatorExist = true
        } catch (e) {}
        return res.status(200).send({
            generatorExist: generatorExist,
            actualCode: actualCode
        })
    }

    private setGenerator = async (req: Request, res: Response) => {
        this.upload.single("generator.js")(req, res, async function (err) {
            if (err) {
                console.error(err);
                return res.status(400).send({
                    message: "Invalid file type."
                })
            }
            if (req.file) {
                copyFileSync(req.file.path, "pldGenerator/custom/customGenerator/customPldGenerator.js");
                rmSync(req.file.path);
            }
            return res.status(200).send({
                message: "Success."
            })
        })
    }

    private getImages = async (req: Request, res: Response) => {
        return res.status(200).send(this.importedGenerator.requireImages);
    }

    private setImages = async (req: Request, res: Response) => {
        const requireImages = this.importedGenerator.requireImages;
        const fields = requireImages.map(x => { return { name: x, maxCount: 1} });
        const filesMiddleware = this.upload.fields(fields);
        filesMiddleware(req, res, async function (err) {
            if (err) {
                console.error(err);
                return res.status(400).send({
                    message: "Invalid file type."
                })
            }
            for (const required of requireImages) {
                if (req.files[required] && req.files[required][0] && req.files[required][0].path) {
                    copyFileSync(req.files[required][0].path, "pldGenerator/assets/" + required);
                    rmSync(req.files[required][0].path);
                }
            }
            return res.status(200).send({
                message: "Success."
            })
        })
    }

    private getChanges = async (req: Request, res: Response) => {
        const allCards = await Card.findAll({
            where: {
                idInSprint: {
                    [Op.ne]: -1
                },
                sprintId: req.wap.sprint.id,
            },
            order: [['sprintId', 'ASC'], ['partId', 'ASC'], ['idInSprint', 'ASC']],
            include: [
                User,
                Part,
                Sprint
            ]
        });
        const allUsers = await User.findAll({
            where: {
                role: {
                    [Op.ne]: "USER"
                }
            }
        });

        let advancementReports :{
            userId: string,
            firstname: string,
            lastname: string,
            report: string
        }[] = [];
        for (const user of allUsers) {
            advancementReports.push({
                userId: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                report: "Pas d'avancements connu\n"
            });
        }

        let cardAdded = '';
        let cardModified = '';
        let warnings: string[] = [];
        for (const card of allCards) {
            const cardVersion = card.sprintId + '.' + card.partId + '.' + card.idInSprint + ((card.version != 1) ? '.' + card.version : '');
            if (!card.actPLD) {
                cardAdded += ((cardAdded != '') ? ', ' : '') + cardVersion;
            } else if (card.actPLD == card.lastPLDEdit) {
                cardModified += ((cardModified != '') ? ', ' : '') + cardVersion;
            }
            if (card.lastPLDStatus != card.status) {
                if (card.status == "FINISHED" || card.status == "STARTED") {
                    for (const user of card.assignees) {
                        if (user.role == "USER") {
                            warnings.push(`${user.firstname} ${user.lastname} is assigned the card ${cardVersion} but is not at least a MAINTENER`);
                            continue;
                        }
                        let report = advancementReports.find(x => x.userId == user.id);
                        if (report.report == "Pas d'avancements connu\n")
                            report.report = "";
                        if (card.status == "FINISHED")
                            report.report += "Carte terminée: " + cardVersion + ", " + card.workingDays + "J/H\n";
                        if (card.status == "STARTED")
                            report.report += "Carte en cours: " + cardVersion + "\n";
                    }
                }
            }
        }
        advancementReports.forEach(x => x.report.trimEnd());
        cardAdded = (cardAdded != '') ? "Cartes ajoutées: " + cardAdded : '';
        cardModified = (cardModified != '') ? "Cartes modifiées: " + cardModified : '';

        return res.status(200).send({
            cardAdded: cardAdded,
            cardModified: cardModified,
            advancementReports: advancementReports,
            warnings: warnings,
        });
    }

    private setChangesAndGeneratePreview = async (req: Request, res: Response) => {
        if (!req.body.pldChanges) {
            req.body["pldChanges"] = "Pas de modifications apportés aux cartes du PLD";
        }
        const changelog = req.body.pldChanges.replace(/[\r+]/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd();
        this.lastChangelog = changelog;

        let changelogOnPLD = "";

        const allPLDs = await PLD.findAll({
            where: {
                sprintId: req.wap.sprint.id
            }
        });
        for (const pld of allPLDs) {
            changelogOnPLD += "PLD Version " + pld.versionInSprint + "\n";
            changelogOnPLD += pld.changesToPLD + "\n";
        }
        changelogOnPLD += "PLD Version " + (allPLDs.length + 1) + "\n";
        changelogOnPLD += changelog;

        const allUsers = await User.findAll({
            where: {
                role: {
                    [Op.ne]: "USER"
                }
            }
        });

        let advancementReports :{
            userId: string,
            firstname: string,
            lastname: string,
            report: string
        }[] = [];
        for (const user of allUsers) {
            if (!req.body["report-" + user.id]) {
                return res.status(400).send({
                    message: "Missing user report for " + user.id + "."
                });
            }
            advancementReports.push({
                userId: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                report: req.body["report-" + user.id].replace(/[\r+]/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd()
            });
        }
        await this.generatePreview(req.wap.sprint.id, changelogOnPLD, advancementReports);
        return res.status(200).send({
            message: "Success."
        });
    }

    private generate = async (req: Request, res: Response) => {
        if (this.lastPreview == null) {
            return res.status(400).send({
                message: "Preview must be made before generating a PLD"
            })
        }

        const allPldsCounts = await PLD.count({
            where: {
                sprintId: req.wap.sprint.id
            }
        });
        let newPldCount = allPldsCounts + 1;
        const fileName = "WAP_PLD_SPRINT" + req.wap.sprint.id + "_VERSION" + newPldCount + ".pdf";
        const path = "./pldGenerator/generated/" + fileName;
        const downloadPath = "/pldGenerated/" + fileName;
        await makePld(this.lastPreview, {}, path);
        
        const newPLD = await PLD.create({
            versionInSprint: newPldCount,
            path: path,
            downloadPath: downloadPath,
            changesToPLD: this.lastChangelog
        });
        newPLD.$set("sprint", req.wap.sprint);
        await newPLD.save();

        const allCards = await Card.findAll({
            where: {
                idInSprint: {
                    [Op.ne]: -1
                },
                sprintId: req.wap.sprint.id,
            }
        })
        for (const card of allCards) {
            card.actPLD = newPldCount;
            card.lastPLDStatus = card.status;
            await card.save();
        }
        return res.status(200).send({
            message: "Success."
        })
    }

    private generatePreview = async (sprintId: number, changelog: string, advancementReports: any[]) => {
        const allCards = await Card.findAll({
            where: {
                idInSprint: {
                    [Op.ne]: -1
                },
                sprintId: sprintId
            },
            order: [['sprintId', 'ASC'], ['partId', 'ASC'], ['idInSprint', 'ASC']],
            include: [
                User,
                Part,
                Sprint
            ]
        });
        const dd = this.importedGenerator.generatePld(allCards, changelog, advancementReports);
        this.lastPreview = dd;
        await makePld(dd, {}, "./pldGenerator/generated/PLD_Preview.pdf");

        // Watermarking
        const document = await PDFDocument.load(readFileSync("./pldGenerator/generated/PLD_Preview.pdf"));
        const pages = document.getPages();
        for (const page of pages) {
            const { width, height } = page.getSize();
            page.drawText("PREVIEW", {
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
        writeFileSync("./pldGenerator/generated/PLD_Preview.pdf", await document.save());
    }

    private checkPreviewExists = async (req: Request, res: Response) => {
        if (this.lastPreview == null) {
            return res.status(400).send({
                message: "No preview generated."
            })
        }
        if (!existsSync("./pldGenerator/generated/PLD_Preview.pdf")) {
            return res.status(400).send({
                message: "No preview file."
            });
        }
        return res.status(200).send({
            url: "/generatedPlds/PLD_Preview.pdf"
        })
    }
}

export default PLDController;