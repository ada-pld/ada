module.exports = { 
    generatePLD(cards) {
        const name = require.resolve("./customGenerator/customPldGenerator");
        if (require.cache[name])
            delete require.cache[name];
        let generator = require("./customGenerator/customPldGenerator");
        return generator.generatePld(cards);
    },
    getRequired() {
        const name = require.resolve("./customGenerator/customPldGenerator");
        if (require.cache[name])
            delete require.cache[name];
        let generator = require("./customGenerator/customPldGenerator");
        return generator.requireImages;
    }
}