const { checkDatabaseConnection, closeDatabaseConnection } = require("../../src/app");
const { default: Config } = require("../../src/models/config");
const { default: User } = require("../../src/models/user");
const { default: Session } = require("../../src/models/session");
const bcrypt = require("bcrypt");
const { default: Part } = require("../../src/models/part");

module.exports = async () => {
    await checkDatabaseConnection();

    if (await Config.checkFailSafe()) {
        console.warn("");
        console.warn("/!\\ WARNING: It seems like the CI is beeing runned on a fail-safed database.");
        console.warn("/!\\ CI will not run since this would require truncating all tables.");
        console.warn("/!\\ To delete the failsafe, connect to the database and delete the TESTS_FAILSAFE row from the Configs table.");
        process.exit(1);
    }

    await User.destroy({ truncate: { cascade: true, force: true }});
    await Session.destroy({ truncate: { cascade: true, force: true }});

    await User.create({
        email: "ci_admin_account@domestia.fr",
        firstname: "CI",
        lastname: "ADMIN",
        password: await bcrypt.hash(process.env.PASS_SALT + "ci", 10),
        role: "ADMIN"
    });
    await User.create({
        email: "ci_editor_account@domestia.fr",
        firstname: "CI",
        lastname: "EDITOR",
        password: await bcrypt.hash(process.env.PASS_SALT + "ci", 10),
        role: "EDITOR"
    });
    await User.create({
        email: "ci_maintener_account@domestia.fr",
        firstname: "CI",
        lastname: "MAINTENER",
        password: await bcrypt.hash(process.env.PASS_SALT + "ci", 10),
        role: "MAINTENER"
    });
    await User.create({
        email: "ci_user_account@domestia.fr",
        firstname: "CI",
        lastname: "MAINTENER",
        password: await bcrypt.hash(process.env.PASS_SALT + "ci", 10),
        role: "USER"
    });

    await Part.create({
        name: "TEST"
    });

    await closeDatabaseConnection();
}