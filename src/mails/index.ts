import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import User from '../models/user';
import { ada } from "../app";
import Card from '../models/card';
import dayjs from 'dayjs';

let transporter :Transporter = null;

export async function setupMailTransporter() {
    if (process.env.NODE_ENV == "test") {
        return;
    }
    try {
        transporter = nodemailer.createTransport({
            host: ada.config.SMTP_Host.value,
            port: parseInt(ada.config.SMTP_Port.value),
            auth: {
                user: ada.config.SMTP_User.value,
                pass: ada.config.SMTP_Password.value
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
    if (!checkMailTransporter())
        return;
    const rendered = await ejs.renderFile('./mails/build/registration.ejs', {
        firstname: newUser.firstname,
        creatorFirstname: creatorUser.firstname,
        creatorLastname: creatorUser.lastname,
        email: newUser.email,
        password: temporaryPassword,
        adaLink: ada.config.Hostname.value,
        adaRepository: "https://github.com/theohemmer/ada"
    });
    const options = {
        from: '"ADA" ' + ada.config.SMTP_User.value.toString(),
        subject: "ADA - Account created",
        to: newUser.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendPasswordForgottenMail(user: User, temporaryPassword: string) {
    if (!checkMailTransporter())
        return;
    const rendered = await ejs.renderFile('./mails/build/password_reset.ejs', {
        firstname: user.firstname,
        email: user.email,
        password: temporaryPassword,
        adaLink: ada.config.Hostname.value,
        adaRepository: "https://github.com/theohemmer/ada"
    });
    const options = {
        from: '"ADA" ' + ada.config.SMTP_User.value.toString(),
        subject: "ADA - Password reset",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendRejectionEmail(user: User, card: Card, rejectionReason: string) {
    if (!checkMailTransporter())
        return;
    const rendered = await ejs.renderFile('./mails/build/card_rejected.ejs', {
        firstname: user.firstname,
        cardTitle: card.name,
        cardRejectionReason: rejectionReason,
        adaRepository: "https://github.com/theohemmer/ada"
    });
    const options = {
        from: '"ADA" ' + ada.config.SMTP_User.value.toString(),
        subject: "ADA - Card rejected",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendApprovalEmail(user: User, card: Card) {
    if (!checkMailTransporter())
        return;
    const rendered = await ejs.renderFile('./mails/build/card_approved.ejs', {
        firstname: user.firstname,
        cardTitle: card.name,
        cardNumber: card.sprintId + "." + card.partId + "." + card.idInSprint,
        cardWorkingDays: card.workingDays,
        adaRepository: "https://github.com/theohemmer/ada"
    });
    const options = {
        from: '"ADA" ' + ada.config.SMTP_User.value.toString(),
        subject: "ADA - Card approved",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendCardAwaitingApprovalEmail(user: User, creator: User, card: Card) {
    if (!checkMailTransporter())
        return;
    const rendered = await ejs.renderFile('./mails/build/card_awaiting_approval.ejs', {
        firstname: user.firstname,
        creatorFirstname: creator.firstname,
        creatorLastname: creator.lastname,
        cardTitle: card.name,
        cardDescription: card.description,
        cardWorkingDays: card.workingDays,
        adaCardsLink: ada.config.Hostname.value + "/cards",
        adaRepository: "https://github.com/theohemmer/ada"
    });
    const options = {
        from: '"ADA" ' + ada.config.SMTP_User.value.toString(),
        subject: "ADA - Card awaiting approval",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendRendezVousCreatedMail(user: User, date: Date, agenda: string) {
    if (!checkMailTransporter())
        return;
    const rendered = await ejs.renderFile('./mails/build/rendez_vous_created.ejs', {
        firstname: user.firstname,
        date: dayjs(date).format("DD/MM/YYYY [à] HH:MM [(UTC+2)]"),
        agenda: ejs.escapeXML(agenda).replace(/\n/g, '<br>'),
        adaCardsLink: ada.config.Hostname.value + "/cards",
        adaRepository: "https://github.com/theohemmer/ada"
    });
    const options = {
        from: '"ADA" ' + ada.config.SMTP_User.value.toString(),
        subject: "ADA - Rendez-Vous created",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}

export async function sendRendezVousPassedMail(user: User, date: Date, report: string, attendance: string) {
    if (!checkMailTransporter())
        return;
    const rendered = await ejs.renderFile('./mails/build/report_posted.ejs', {
        firstname: user.firstname,
        date: dayjs(date).format("DD/MM/YYYY [à] HH:MM [(UTC+2)]"),
        report: ejs.escapeXML(report).replace(/\n/g, '<br>'),
        attendance: attendance,
        adaCardsLink: ada.config.Hostname.value + "/cards",
        adaRepository: "https://github.com/theohemmer/ada"
    });
    const options = {
        from: '"ADA" ' + ada.config.SMTP_User.value.toString(),
        subject: "ADA - Rendez-Vous report published",
        to: user.email,
        html: rendered
    }
    await transporter.sendMail(options);
}