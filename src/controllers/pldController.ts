import IController from "./controller";
import express, {NextFunction, Request, Response } from "express";
import { authUser } from "../middlewares/auth";
import Card from "../models/card";
import makePld from "../../pldGenerator";
import { Op } from "sequelize";
import User from "../models/user";
import Part from "../models/part";
import { checkPerm } from "../middlewares/checkPerms";
import multer, { MulterError } from "multer";
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
        this.router.get("/", authUser, checkPerm("EDITOR"), this.pld);
        this.router.get("/setGenerator", authUser, checkPerm("EDITOR"), this.setGeneratorGET);
        this.router.post("/setGenerator", authUser, checkPerm("ADMIN"), this.setGeneratorPOST);
        this.router.get("/setImages", authUser, checkPerm("EDITOR"), this.importGenerator, this.setImagesGET);
        this.router.post("/setImages", authUser, checkPerm("EDITOR"), this.importGenerator, this.setImagesPOST);
        this.router.get("/setChanges", authUser, checkPerm("EDITOR"), this.importGenerator, this.checkAssets, this.setChangesGET);
        this.router.post("/setChanges", authUser, checkPerm("EDITOR"), this.importGenerator, this.checkAssets, this.setChangesPOST);
        this.router.get("/seePreview", authUser, checkPerm("EDITOR"), this.importGenerator, this.checkAssets, this.seePreviewGET);
        this.router.post("/generateFinal", authUser, checkPerm("EDITOR"), this.importGenerator, this.checkAssets, this.generateFinalPOST);
    }

    private pld = async (req: Request, res: Response) => {
        const allPLDs = await PLD.findAll({
            include: [
                Sprint
            ]
        });
        return res.render("pld/plds", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user,
            allPLDs: allPLDs
        });
    }

    private importGenerator = async (req: Request, res: Response, next: NextFunction) => {
        const imported = await import("../../pldGenerator/custom");
        if (!imported.getGenerator || !imported.getRequired)
            return res.redirect("/pld/setGenerator/?error=invalid_or_missing_generator");
        try {
            this.importedGenerator.generatePld = imported.default.getGenerator();
            this.importedGenerator.requireImages = imported.default.getRequired();
        } catch (ex) {
            console.error(ex);
            return res.redirect("/pld/setGenerator/?error=invalid_generator");
        }
        next();
    }

    private checkAssets = async (req: Request, res: Response, next: NextFunction) => {
        const requiredImages = this.importedGenerator.requireImages;
        for (const image of requiredImages)
            if (!existsSync("pldGenerator/assets/" + image))
                return res.redirect("/pld/setImages?error=missing_assets");
        return next();
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
            generatorExist: generatorExist,
            isAdmin: (req.user.role == "ADMIN")
        })
    }

    private setGeneratorPOST = async (req: Request, res: Response) => {
        this.upload.single("generator.js")(req, res, async function (err) {
            if (err) {
                console.error(err);
                return res.redirect("/pld/setGenerator?error=invalid_file_type");
            }
            if (req.file) {
                copyFileSync(req.file.path, "pldGenerator/custom/customGenerator/customPldGenerator.js");
                rmSync(req.file.path);
            }
            return res.redirect("/pld/setImages");
        })
    }

    private setImagesGET = async (req: Request, res: Response) => {
        return res.render("pld/set_images", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user,
            requiredImages: this.importedGenerator.requireImages,
        })
    }

    private setImagesPOST = async (req: Request, res: Response) => {
        const requireImages = this.importedGenerator.requireImages;
        const fields = requireImages.map(x => { return { name: x, maxCount: 1} });
        const filesMiddleware = this.upload.fields(fields);
        filesMiddleware(req, res, async function (err) {
            if (err) {
                console.error(err);
                return res.redirect("/pld/setImages?error=invalid_file_type");
            }
            for (const required of requireImages) {
                if (req.files[required] && req.files[required][0] && req.files[required][0].path) {
                    copyFileSync(req.files[required][0].path, "pldGenerator/assets/" + required);
                    rmSync(req.files[required][0].path);
                }
            }
            // TODO: redirect to a summary page before generating preview
            return res.redirect("/pld/setChanges");
        })
    }

    private setChangesGET = async (req: Request, res: Response) => {
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
        for (const card of allCards) {
            const cardVersion = card.sprintId + '.' + card.partId + '.' + card.idInSprint + ((card.version != 1) ? '.' + card.version : '');
            if (card.actPLD == 0) {
                cardAdded += ((cardAdded != '') ? ', ' : '') + cardVersion;
            } else if (card.actPLD == card.lastPLDEdit) {
                cardModified += ((cardModified != '') ? ', ' : '') + cardVersion;
            }
            if (card.lastPLDStatus != card.status) {
                if (card.status == "FINISHED" || card.status == "STARTED") {
                    for (const user of card.assignees) {
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

        return res.render("pld/set_changes", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user,
            cardAdded: cardAdded,
            cardModified: cardModified,
            advancementReports: advancementReports,
        })
    }

    private setChangesPOST = async (req: Request, res: Response) => {
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
                return res.redirect("/pld/setChanges?error=missing_user_report");
            }
            advancementReports.push({
                userId: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                report: req.body["report-" + user.id].replace(/[\r+]/g, '').replace(/^(\s*$)(?:\r\n?|\n)/gm, '').trimEnd()
            });
        }
        return this.generatePreview(req, res, changelogOnPLD, advancementReports);
    }

    private seePreviewGET = async (req: Request, res: Response) => {
        if (this.lastPreview == null)
            return res.redirect("/pld/?error=no_preview");
        if (!existsSync("./pldGenerator/generated/PLD_Preview.pdf"))
            return res.redirect("/pld/?error=no_preview_file");
        return res.render("pld/see_preview", {
            currentPage: '/pld',
            wap: req.wap,
            user: req.user
        });
    }

    private generateFinalPOST = async (req: Request, res: Response) => {
        if (this.lastPreview == null)
            return res.redirect("/pld/?error=no_pld_to_generate");
        
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
        return res.redirect("/pld/?info=success");
    }

    private generatePreview = async (req: Request, res: Response, changelog: string, advancementReports: any[]) => {
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

        // Success
        return res.redirect("/pld/seePreview");
    }
}

export default PLDController;