import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import User from '../models/user';
import { wap } from "../app";
import Card from '../models/card';

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
        wapRepository: "https://github.com/theohemmer/wap"
    });
    const options = {
        from: '"WAP" ' + wap.config.SMTP_User.value.toString(),
        subject: "WAP - Account created",
        to: newUser.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendRejectionEmail(user: User, card: Card, rejectionReason: string) {
    const rendered = await ejs.renderFile('./mails/build/card_rejected.ejs', {
        firstname: user.firstname,
        cardTitle: card.name,
        cardRejectionReason: rejectionReason,
        wapRepository: "https://github.com/theohemmer/wap"
    });
    const options = {
        from: '"WAP" ' + wap.config.SMTP_User.value.toString(),
        subject: "WAP - Card rejected",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendApprovalEmail(user: User, card: Card) {
    const rendered = await ejs.renderFile('./mails/build/card_approved.ejs', {
        firstname: user.firstname,
        cardTitle: card.name,
        cardNumber: card.sprintId + "." + card.partId + "." + card.idInSprint,
        cardWorkingDays: card.workingDays,
        wapRepository: "https://github.com/theohemmer/wap"
    });
    const options = {
        from: '"WAP" ' + wap.config.SMTP_User.value.toString(),
        subject: "WAP - Card approved",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendCardAwaitingApprovalEmail(user: User, creator: User, card: Card) {
    const rendered = await ejs.renderFile('./mails/build/card_awaiting_approval.ejs', {
        firstname: user.firstname,
        creatorFirstname: creator.firstname,
        creatorLastname: creator.lastname,
        cardTitle: card.name,
        cardDescription: card.description,
        cardWorkingDays: card.workingDays,
        wapCardsLink: wap.config.Hostname.value + "/cards",
        wapRepository: "https://github.com/theohemmer/wap"
    });
    const options = {
        from: '"WAP" ' + wap.config.SMTP_User.value.toString(),
        subject: "WAP - Card awaiting approval",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}