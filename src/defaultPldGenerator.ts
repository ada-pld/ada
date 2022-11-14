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

function addTitleAndToc(content :any[], name: string, nest :number) {
    const title = name.replace(/ /g, ' ');
    let points = '';
    let spaces = '';
    for (let i = 0; i < nest; i++) {
        spaces += "  "
    }
    spaces = (spaces.length > 0) ? spaces + "- " : "";
    for (let i = title.length + spaces.length; i < 70; i++) {
        points += '.';
    }
    let tocItem = {
        text: spaces + title + points,
        style: 'invisible',
        id: title,
        tocItem: 'mainToc',
        tocStyle: {
            font: "Anonymous"
        }
    }
    if (nest == 0) {
        tocItem['pageBreak'] = 'before'
    }
    content.push(tocItem);
    content.push({ text: title, style: 'subHeaders' });
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
        image: "pldGenerator/assets/domestia_logo.png",
        width: 350,
        margin: [ 0, 150, 0, 0 ],
        alignment: 'center'
    });
    headerPage.push({
        image: "pldGenerator/assets/epitech_logo.png",
        width: 350,
        margin: [ 0, 150, 0, 0 ],
        pageBreak: "after",
        alignment: 'center'
    });
    return headerPage;
}

function addAllCards(allCards: Card[]) {
    let cards :any[] = [];
    let last_part = -1;

    for (const card of allCards) {
        if (card.partId != last_part) {
            last_part = card.partId;
            addTitleAndToc(cards, card.part.name, 0);
        }
        cards.push(createATable(card));
    }
    return cards;
}

function addAllSchemas() {
    let allSchemas :any[] = [];
    addTitleAndToc(allSchemas, "Schémas", 0);

    addTitleAndToc(allSchemas, "Schéma global", 1);
    allSchemas.push({
        image: "pldGenerator/assets/global_schema.png",
        width: 450,
        alignment: "center"
    })
    return allSchemas;
}

function addAllAdvancementReports() {
    let allAdvancementReports: any[] = [];
    addTitleAndToc(allAdvancementReports, "Rapports d'avancements", 0);

    allAdvancementReports.push({
        text: "Faut que je fasse l'ajout des raports d'avancements",
    });
    return allAdvancementReports;
}

export const requireImages = [
    "domestia_logo.png",
    "epitech_logo.png",
    "global_schema.png",
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