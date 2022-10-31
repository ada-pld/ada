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

export default function generatePLD(allCards: Card[]) {
    let test :any[] = [];
    let links :any[] = [];
    let last_part = -1;
    for (const card of allCards) {
        if (card.partId != last_part) {
            last_part = card.partId;
            test.push({text: card.part.name, pageBreak: 'before', style: 'subHeaders', id: card.part.name, tocItem: 'mainToc'});
            links.push({text: card.part.name, linkToDestination: card.part.name});
        }
        test.push(createATable(card));
    }
    links.push({text: '', pageBreak: 'after'});
    let dd = {
        content: [
            {
                toc: {
                    id: 'mainToc',
                    title: {text: 'Index'}
                }
            },
            ...links,
            ...test
        ],
        styles: {
            subHeaders: {
                fontSize: 16,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            tableMargin: {
                margin: [10, 10, 10, 10]
            }
        }
    }
    return dd;
}