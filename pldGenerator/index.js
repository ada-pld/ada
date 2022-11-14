var PdfPrinter = require("pdfmake");
var fs = require('fs');

var fonts = {
    Roboto: {
        normal: './pldGenerator/fonts/Roboto-Regular.ttf',
        bold: './pldGenerator/fonts/Roboto-Medium.ttf',
        italics: './pldGenerator/fonts/Roboto-Itatlic.ttf',
        bolditalics: './pldGenerator/fonts/Roboto-MediumItalic.ttf'
    },
    Anonymous: {
        normal: './pldGenerator/fonts/Anonymous_Pro.ttf'
    }
}

module.exports = function makePld(docDefinition, options, fileName)
{
    var printer = new PdfPrinter(fonts);
    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
    try {
        fs.mkdirSync("./pldGenerator/generated");
    } catch (e) {
        if (e.code !== "EEXIST") {
            throw e;
        }
    }
    const stream = pdfDoc.pipe(fs.createWriteStream(fileName))
    pdfDoc.end();
    const promise = new Promise((resolve, reject) => {
        stream.on("finish", () => {
            resolve();
        })
        stream.on("error", () => {
            reject();
        })
    })
    return promise;
}