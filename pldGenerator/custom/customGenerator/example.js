/**
 * This is a list of string used to tell the front-end what images are required on the final PLD
 */
module.exports.requireImages = []

module.exports.generatePld = function generatePld(cards) {
    /**
     * You get the cards here, you can generate the PLD as you want with them
     * The module used to generate the PDF is pdfmake, you might want to take a look at their documentation
     * An exemple generator is coded in src/defaultPldGenerator.ts
     * Returns an array with the component you want on the final PDF, ADA will take care of the rest
     */
    let components = []
    return components;
}