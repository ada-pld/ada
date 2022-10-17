import IController from "./controller";
import express, {request, Request, Response} from "express";
import { authUser } from "../middlewares/auth";
import { checkPerm } from "../middlewares/checkPerms";
import User, {Role} from "../models/user";
import * as bcrypt from "bcrypt";

class UserController implements IController {
    public path = "/users";
    public router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", authUser, checkPerm("EDITOR"), this.getUsers);
        this.router.get("/create", authUser, checkPerm("EDITOR"), this.createUserGET);
        this.router.post("/create", authUser, checkPerm("EDITOR"), this.createUserPOST);
        this.router.get("/edit/:id", authUser, this.editUserGET)
        this.router.post("/edit", authUser, this.editUserPOST)
    }

    private getUsers = async (req: Request, res: Response) => {
        const allUsers = req.wap.users;

        return res.render("users/users", {
            currentPage: '/users',
            wap: req.wap,
            user: req.user,
            allUsers: allUsers
        });
    }

    private createUserGET = (req: Request, res: Response) => {
        return res.render("users/create_user", {
            currentPage: '/users',
            wap: req.wap,
            user: req.user,
            isAdmin: (req.user.role == "ADMIN")
        })
    }

    private createUserPOST = async (req: Request, res: Response) => {
        if (!req.body.firstname || !req.body.lastname || !req.body.password || !req.body.email || !req.body.role)
            return res.redirect("/users/create/?error=invalid_body");
        if (req.body.role != "ADMIN" && req.body.role != "EDITOR" && req.body.role != "MAINTAINER" && req.body.role != "USER")
            return res.redirect("/users/create/?error=invalid_body");
        if (req.user.role == "EDITOR" && req.body.role == "ADMIN")
            return res.redirect("/users/create/?error=no_permissions");
        const already_exists = await User.findOne({
            where: {
                email: req.body.email
            }
        });
        if (already_exists) {
            return res.redirect("/users/create/?error=already_exists");
        }
        const created = await User.create({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: await bcrypt.hash(process.env.PASS_SALT + req.body.password, 10),
            role: req.body.role
        })
        req.wap.users = await User.findAll();
        return res.redirect("/users/?info=success");
    }

    private editUserGET = async (req: Request, res: Response) => {
        if (!req.params.id)
            return res.redirect("/users/?error=no_id");
        const toEdit = await User.findOne({
            where: {
                id: req.params.id
            }
        });
        if (!toEdit) {
            return res.redirect("/users/?error=bad_id");
        }
        if (req.user.role != "ADMIN" && req.user.role != "EDITOR") {
            if (req.user.id != toEdit.id) {
                return res.redirect("/dashboard/?error=no_permissions");
            }
        }
        let canEditInfos = true;
        if (toEdit.role == "ADMIN" && req.user.role != "ADMIN") canEditInfos = false;
        if (req.user.role != "ADMIN" && req.user.role != "EDITOR") canEditInfos = false;
        return res.render("users/edit_user", {
            currentPage: '/users',
            wap: req.wap,
            user: req.user,
            isAdmin: (req.user.role == "ADMIN"),
            isEditor: (req.user.role == "ADMIN" || req.user.role == "EDITOR"),
            canEditInfos: canEditInfos,
            toEdit: toEdit
        })
    }

    private editUserPOST = async (req: Request, res: Response) => {
        if (!req.body.id)
            return res.redirect("/users?error=invalid_body");
        const toEdit = await User.findOne({
            where: {
                id: req.body.id
            }
        });
        if (!toEdit) {
            return res.redirect("/users/?error=bad_id");
        }
        if (req.user.role != "ADMIN" && req.user.role != "EDITOR") {
            if (req.user.id != toEdit.id) {
                return res.redirect("/dashboard/?error=no_permissions");
            }
        }
        let canEditInfos = true;
        if (toEdit.role == "ADMIN" && req.user.role != "ADMIN") canEditInfos = false;
        if (req.user.role != "ADMIN" && req.user.role != "EDITOR") canEditInfos = false;
        if (canEditInfos) {
            console.log(req.body);
            if (req.body.role != "") {
                if (req.body.role != "ADMIN" && req.body.role != "EDITOR" && req.body.role != "MAINTAINER" && req.body.role != "USER")
                    return res.redirect("/users/create/?error=invalid_body");
            }
            if (req.user.role == "EDITOR" && req.body.role == "ADMIN")
                return res.redirect("/users/create/?error=no_permissions");
            if (req.body.firstname != "")
                toEdit.firstname = req.body.firstname;
            if (req.body.lastname != "")
                toEdit.lastname = req.body.lastname;
            if (req.body.email != "")
                toEdit.email = req.body.email;
            if (req.body.password != "")
                toEdit.password = await bcrypt.hash(process.env.PASS_SALT + req.body.password, 10);
            if (req.body.role != "")
                toEdit.role = req.body.role;
            req.wap.users = await User.findAll();
            await toEdit.save();
            return res.redirect("/users/?info=success");
        } else {
            if (req.body.password != "")
                toEdit.password = await bcrypt.hash(process.env.SALT + req.body.password, 10);
            req.wap.users = await User.findAll();
            await toEdit.save();
            return res.redirect("/dashboard?info=success");
        }
        
    }
}

export default UserController;