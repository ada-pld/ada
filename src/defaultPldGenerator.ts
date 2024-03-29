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

interface report {
    userId: string;
    firstname: string;
    lastname: string;
    report: string;
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
                [{text: 'En tant que:', colSpan: 3}, '', '', {text: 'Je veux:', colSpan: 3}, '', ''],
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

function addTitleAndToc(content :any[], name: string, nest: number, pageBreak: boolean) {
    const title = name.replace(/ /g, ' ');
    let points = '';
    let spaces = '|';
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
    if (pageBreak) {
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
    let first = true;

    addTitleAndToc(cards, "Carte User-Stories", 0, true)

    for (const card of allCards) {
        if (card.partId != last_part) {
            last_part = card.partId;
            addTitleAndToc(cards, card.part.name, 1, !first);
            first = false;
        }
        cards.push(createATable(card));
    }
    return cards;
}

function addAllSchemas() {
    let allSchemas :any[] = [];
    addTitleAndToc(allSchemas, "Schémas", 0, true);

    addTitleAndToc(allSchemas, "Schéma global", 1, false);
    allSchemas.push({
        image: "pldGenerator/assets/global_schema.png",
        width: 450,
        alignment: "center"
    })
    addTitleAndToc(allSchemas, "Schéma Algorithme", 1, false);
    allSchemas.push({
        image: "pldGenerator/assets/Algo.png",
        width: 450,
        alignment: "center"
    })
    addTitleAndToc(allSchemas, "Schéma API - Backoffice", 1, false);
    allSchemas.push({
        image: "pldGenerator/assets/Api_BackOffice.png",
        width: 450,
        alignment: "center"
    })
    addTitleAndToc(allSchemas, "Schéma API - Backend", 1, false);
    allSchemas.push({
        image: "pldGenerator/assets/Backend.png",
        width: 450,
        alignment: "center"
    })
    addTitleAndToc(allSchemas, "Schéma FrontEnds - Client", 1, false);
    allSchemas.push({
        image: "pldGenerator/assets/Client.png",
        width: 450,
        alignment: "center"
    })
    addTitleAndToc(allSchemas, "Schéma FrontEnds - Professionnel", 1, false);
    allSchemas.push({
        image: "pldGenerator/assets/Pro.png",
        width: 450,
        alignment: "center"
    })
    addTitleAndToc(allSchemas, "Schéma FrontEnd - Backoffice", 1, false);
    allSchemas.push({
        image: "pldGenerator/assets/Front_BackOffice.png",
        width: 450,
        alignment: "center"
    })
    return allSchemas;
}

function addChangelogPage(changelog: string) {
    let changelogPage: any[] = [];
    addTitleAndToc(changelogPage, "Changements sur le PLD", 0, true);

    const changelogBody = changelog.split('\n').map((x) => {
        const to_ret = {
            text: x || ""
        }
        return [to_ret];
    })
    changelogPage.push({
        color: '#444',
        style: 'tableMargin',
        table: {
            widths: ['*'],
            headerRows: 0,
            body: changelogBody,
            unbreakable: true
        },
        unbreakable: true
    })
    return changelogPage;
}

function addAllAdvancementReportsPage(advancementReports :report[]) {
    let allAdvancementReports: any[] = [];
    addTitleAndToc(allAdvancementReports, "Rapports d'avancements", 0, true);

    for (const report of advancementReports) {
        addTitleAndToc(allAdvancementReports, report.firstname + " " + report.lastname, 1, false);
        const reportBody = report.report.split('\n').map((x) => {
            const to_ret = {
                text: x
            }
            return [to_ret];
        })
        allAdvancementReports.push({
            color: '#444',
            style: 'tableMargin',
            table: {
                widths: ['*'],
                headerRows: 0,
                body: reportBody,
                unbreakable: true
            },
            unbreakable: true
        })
    }
    return allAdvancementReports;
}

export const requireImages = [
    "domestia_logo.png",
    "epitech_logo.png",
    "global_schema.png",
    "Algo.png",
    "Api_BackOffice.png",
    "Backend.png",
    "Client.png",
    "Front_BackOffice.png",
    "Pro.png"
]

export function generatePLD(allCards: Card[], changelog: string, advancementReports :report[]) {
    const headerPage = addHeaderPage(allCards[0].sprint.name);
    const changelogPage = addChangelogPage(changelog);
    const schemas = addAllSchemas();
    const cards = addAllCards(allCards);
    const advancementReportsPage = addAllAdvancementReportsPage(advancementReports);
    let dd = {
        content: [
            ...headerPage,
            {
                toc: {
                    id: 'mainToc',
                    title: {text: 'Index'}
                }
            },
            ...changelogPage,
            ...schemas,
            ...cards,
            ...advancementReportsPage
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