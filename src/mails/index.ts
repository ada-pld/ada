import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import User from '../models/user';

let transporter :Transporter = null;

export async function setup() {
    transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST.toString(),
        port: parseInt(process.env.MAIL_PORT.toString()),
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
        }
    })
}

export async function sendCreationEmail(newUser: User, creatorUser: User, temporaryPassword: string) {
    const rendered = await ejs.renderFile('./mails/build/registration.ejs', {
        firstname: newUser.firstname,
        creatorFirstname: creatorUser.firstname,
        creatorLastname: creatorUser.lastname,
        email: newUser.email,
        password: temporaryPassword,
        wapLink: process.env.HOSTNAME,
        wapRepository: "https://github.com/DomestiaDev/wap"
    });
    const options = {
        from: '"WAP" ' + process.env.MAIL_USERNAME.toString(),
        subject: "WAP - Account created",
        to: newUser.email,
        html: rendered
    }
    await transporter.sendMail(options);
}