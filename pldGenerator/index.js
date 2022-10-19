var PdfPrinter = require("pdfmake");
var fs = require('fs');

var fonts = {
    Roboto: {
        normal: './pldGenerator/fonts/Roboto-Regular.ttf',
        bold: './pldGenerator/fonts/Roboto-Medium.ttf',
        italics: './pldGenerator/fonts/Roboto-Itatlic.ttf',
        bolditalics: './pldGenerator/fonts/Roboto-MediumItalic.ttf'
    }
}

module.exports = function makePld(docDefinition, options, fileName)
{
    var printer = new PdfPrinter(fonts);
    var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
    pdfDoc.pipe(fs.createWriteStream(fileName));
    pdfDoc.end();
}