module.exports = function generatePld(cards) {
    let generator = require("./customGenerator/customPldGenerator");
    return generator.generatePld(cards);
}