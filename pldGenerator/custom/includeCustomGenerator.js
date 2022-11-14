module.exports = { 
    getGenerator() {
        const name = require.resolve("./customGenerator/customPldGenerator");
        if (require.cache[name])
            delete require.cache[name];
        let generator = require("./customGenerator/customPldGenerator");
        return generator.generatePLD;
    },
    getRequired() {
        const name = require.resolve("./customGenerator/customPldGenerator");
        if (require.cache[name])
            delete require.cache[name];
        let generator = require("./customGenerator/customPldGenerator");
        return generator.requireImages;
    }
}