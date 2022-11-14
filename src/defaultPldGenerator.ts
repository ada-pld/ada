interface Sprint {
    id: number;
    name: string;
    workDaysNeeded: number;
    cards: Card[];
}

interface User {
    firstname: string;
    lastname: string;
    cards: Card[];
}

interface Part {
    id: number;
    name: string;
    cards: Card[];
}

interface Card {
    version: number;
    idInSprint: number;
    name: string;
    asWho: string;
    task: string;
    description: string;
    workingDays: number;
    assignees: User[];
    sprintId: number;
    sprint: Sprint;
    partId: number;
    part: Part;
    dods: string;
}

function createATable(card: Card)
{
    const cardVersion: string = card.sprintId + '.' + card.partId + '.' + card.idInSprint + ((card.version != 1) ? '.' + card.version : '');
    const cardName: string = card.name;
    const asWho: string = card.asWho;
    const iWant: string = card.task;
    const descritpion: string = card.description;
    const workingDays: string = card.workingDays + '';
    let assigneesNames: string = "";
    const dods: string = card.dods;

    for (let i = 0; i < card.assignees.length; i++) {
        assigneesNames += card.assignees[i].firstname + " " + card.assignees[i].lastname + ((i != card.assignees.length - 1) ? " & " : "");
    }

    return {
        color: '#444',
        style: 'tableMargin',
        table: {
            widths: ['*', '*', '*', '*', '*', '*'],
            headerRows: 0,
            body: [
                [{text: cardVersion, colSpan: 1}, {text: cardName, colSpan: 5}, '', '', '', ''],
                [{text: assigneesNames, colSpan: 6}, '', '', '', ''],
                [{text: 'En temps que:', colSpan: 3}, '', '', {text: 'Je veux:', colSpan: 3}, '', ''],
                [{text: `\n${asWho}`, colSpan: 3, alignment:'center'}, '', '', {text: iWant, colSpan: 3, alignment:'center'}, '', ''],
                [{text: `Description:\n${descritpion}`, colSpan: 6}, '', '', '', '', ''],
                [{text: `Definitions of Dones:\n\n${dods}`, colSpan: 6}, '', '', '', '', ''],
                [{text: 'Charge de travail estimé:', colSpan: 2}, '', {text: `${workingDays}J/H`, colSpan: 4}]
            ],
            unbreakable: true
        },
        unbreakable: true
    }
}

function addHeaderPage(sprintName: string) {
    const headerPage :any[] = [];
    headerPage.push({
        text: "Project Log Document",
        style: 'mainHeader',
        alignment: "center"
    });
    headerPage.push({
        text: sprintName + " - Domestia",
        style: 'sprintName',
        alignment: 'center'
    });
    headerPage.push({
        text: "LOGO DOMESTIA",
        alignment: 'center'
    })
    headerPage.push({
        text: "LOGO EPITECH",
        pageBreak: "after",
        alignment: 'center'
    })
    return headerPage;
}

function addAllCards(allCards: Card[]) {
    let cards :any[] = [];
    let last_part = -1;

    for (const card of allCards) {
        if (card.partId != last_part) {
            last_part = card.partId;
            let points = '';
            for (let i = card.part.name.length; i < 70; i++) {
                points += '.';
            }
            cards.push({
                text: card.part.name.replace(/ /g, ' ') + points,
                pageBreak: 'before',
                style: 'invisible',
                id: card.part.name,
                tocItem: 'mainToc',
                tocStyle: {
                    font: "Anonymous"
                }
            });
            cards.push({ text: card.part.name.replace(/ /g, ' '), style: 'subHeaders' });
        }
        cards.push(createATable(card));
    }
    return cards;
}

function addAllSchemas() {
    let allSchemas :any[] = [];
    const title = "Schéma";

    let points = '';
    for (let i = title.length; i < 70; i++) {
        points += '.';
    }

    allSchemas.push({
        text: title + points,
        pageBreak: 'before',
        style: 'invisible',
        id: title,
        tocItem: 'mainToc',
        tocStyle: {
            font: "Anonymous"
        }
    });
    allSchemas.push({ text: title, style: 'subHeaders' });
    allSchemas.push({
        text: "Faut que je fasse l'ajout de schémas",
    });
    return allSchemas;
}

function addAllAdvancementReports() {
    let allAdvancementReports: any[] = [];
    const title = "Rapports d'avancements";

    let points = '';
    for (let i = title.length; i < 70; i++) {
        points += '.';
    }

    allAdvancementReports.push({
        text: title + points,
        pageBreak: 'before',
        style: 'invisible',
        id: title,
        tocItem: 'mainToc',
        tocStyle: {
            font: "Anonymous"
        }
    });
    allAdvancementReports.push({ text: title, style: 'subHeaders' });
    allAdvancementReports.push({
        text: "Faut que je fasse l'ajout des raports d'avancements",
    });
    return allAdvancementReports;
}

export const requireImages = [
    "domestia_logo.png",
    "epitech_logo.png",
    "global_schema.png",
    "front_mobile.png",
    "front_web.png",
    "backend.png",
    "recommandation_algorithm.png",
    "security.png",
]

export function generatePLD(allCards: Card[]) {
    const headerPage = addHeaderPage(allCards[0].sprint.name);
    const cards = addAllCards(allCards);
    const schemas = addAllSchemas();
    const advancementReports = addAllAdvancementReports();
    let dd = {
        content: [
            ...headerPage,
            {
                toc: {
                    id: 'mainToc',
                    title: {text: 'Index'}
                }
            },
            ...schemas,
            ...cards,
            ...advancementReports
        ],
        styles: {
            subHeaders: {
                fontSize: 16,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            tableMargin: {
                margin: [10, 10, 10, 10]
            },
            invisible: {
                fontSize: 0,
                margin: [0, 0, 0, 0]
            },
            mainHeader: {
                fontSize: 32,
                bold: true,
            },
            sprintName: {
                fontSize: 16,
                bold: true,
            }
        }
    }
    return dd;
}