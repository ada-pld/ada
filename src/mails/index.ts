import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import User from '../models/user';
import { wap } from "../app";

let transporter :Transporter = null;

export async function setupMailTransporter() {
    try {
        transporter = nodemailer.createTransport({
            host: wap.config.SMTP_Host.value,
            port: parseInt(wap.config.SMTP_Port.value),
            auth: {
                user: wap.config.SMTP_User.value,
                pass: wap.config.SMTP_Password.value
            }
        })
        await transporter.verify()
    } catch (e) {
        transporter = null;
    }
}

export function checkMailTransporter() {
    return transporter != null;
}

export async function sendCreationEmail(newUser: User, creatorUser: User, temporaryPassword: string) {
    const rendered = await ejs.renderFile('./mails/build/registration.ejs', {
        firstname: newUser.firstname,
        creatorFirstname: creatorUser.firstname,
        creatorLastname: creatorUser.lastname,
        email: newUser.email,
        password: temporaryPassword,
        wapLink: wap.config.Hostname.value,
        wapRepository: "https://github.com/DomestiaDev/wap"
    });
    const options = {
        from: '"WAP" ' + wap.config.SMTP_User.value.toString(),
        subject: "WAP - Account created",
        to: newUser.email,
        html: rendered
    }
    await transporter.sendMail(options);
}