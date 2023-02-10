const { checkDatabaseConnection, closeDatabaseConnection } = require("../../src/app");
const { default: Config } = require("../../src/models/config");
const { default: User } = require("../../src/models/user");
const { default: Session } = require("../../src/models/session");
const bcrypt = require("bcrypt");
const { default: Part } = require("../../src/models/part");
const { default: Card } = require("../../src/models/card");
const { default: Sprint } = require("../../src/models/sprint");

module.exports = async () => {
    console.log("Setting up tests.");
    await checkDatabaseConnection();

    if (await Config.checkFailSafe()) {
        console.warn("");
        console.warn("/!\\ WARNING: It seems like the CI is beeing runned on a fail-safed database.");
        console.warn("/!\\ CI will not run since this would require truncating all tables.");
        console.warn("/!\\ To delete the failsafe, connect to the database and delete the TESTS_FAILSAFE row from the Configs table.");
        process.exit(1);
    }

    await User.destroy({ truncate: { cascade: true, force: true }});
    await Session.destroy({ truncate: { cascade: true, force: true }, restartIdentity: true});
    await Part.destroy({ truncate: { cascade: true, force: true }, restartIdentity: true});
    await Sprint.destroy({ truncate: { cascade: true, force: true }, restartIdentity: true});
    await Card.destroy({ truncate: { cascade: true, force: true }, restartIdentity: true});

    let testAdmin = await User.create({
        email: "ci_admin_account@domestia.fr",
        firstname: "CI",
        lastname: "ADMIN",
        password: await bcrypt.hash(process.env.PASS_SALT + "ci", 10),
        role: "ADMIN"
    });
    let testEditor = await User.create({
        email: "ci_editor_account@domestia.fr",
        firstname: "CI",
        lastname: "EDITOR",
        password: await bcrypt.hash(process.env.PASS_SALT + "ci", 10),
        role: "EDITOR"
    });
    let testMaintener = await User.create({
        email: "ci_maintener_account@domestia.fr",
        firstname: "CI",
        lastname: "MAINTENER",
        password: await bcrypt.hash(process.env.PASS_SALT + "ci", 10),
        role: "MAINTENER"
    });
    let testUser = await User.create({
        email: "ci_user_account@domestia.fr",
        firstname: "CI",
        lastname: "MAINTENER",
        password: await bcrypt.hash(process.env.PASS_SALT + "ci", 10),
        role: "USER"
    });

    let testPart = await Part.create({
        name: "TEST",
    });

    let testSprint = await Sprint.create({
        name: "Sprint test",
        workDaysNeeded: 12,
        active: true
    })

    let testCard = await Card.create({
        name: "Test name",
        asWho: "Developer",
        task: "Test task",
        description: "Test description",
        dods: "Test dods",
        workingDays: 1,
        lastPLDEdit: 0,
        actPLD: 0,
        sprintId: testSprint.id,
        partId: testPart.id
    })

    await testCard.$add('assignees', testAdmin);
    await testCard.$add('assignees', testUser);

    await closeDatabaseConnection();
    console.log("Starting.");
}