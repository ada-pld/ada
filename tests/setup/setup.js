const { checkDatabaseConnection, closeDatabaseConnection } = require("../../src/app");
const { default: Config } = require("../../src/models/config");
const { default: User } = require("../../src/models/user");
const { default: Session } = require("../../src/models/session");
const bcrypt = require("bcrypt");
const { default: Part } = require("../../src/models/part");
const { default: Card } = require("../../src/models/card");
const { default: Sprint } = require("../../src/models/sprint");
const { default: RendezVous } = require("../../src/models/rendezVous");
const { default: RendezVousUserAttendance } = require("../../src/models/rendezVousUserAttendance");
const { default: db } = require("../../src/models")

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

    await db.sync({force: true})

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
        lastname: "USER",
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

    await Sprint.create({
        name: "Sprint test 2",
        workDaysNeeded: 24,
        active: false
    })

    let testCard = await Card.create({
        name: "Test name",
        asWho: "Developer",
        task: "Test task",
        description: "Test description",
        dods: "Test dods",
        status: "FINISHED",
        workingDays: 1,
        lastPLDEdit: 0,
        actPLD: 0,
        sprintId: testSprint.id,
        partId: testPart.id
    });

    await ((await Card.create({
        name: "A",
        asWho: "Developer",
        task: "Test task",
        description: "Test description",
        dods: "Test dods",
        status: "STARTED",
        workingDays: 3,
        lastPLDEdit: 0,
        actPLD: 0,
        sprintId: testSprint.id,
        partId: testPart.id
    })).$add("assignees", testAdmin))

    await ((await Card.create({
        name: "B",
        asWho: "Developer",
        task: "Test task",
        description: "Test description",
        dods: "Test dods",
        status: "NOT_STARTED",
        workingDays: 4,
        lastPLDEdit: 0,
        actPLD: 0,
        sprintId: testSprint.id,
        partId: testPart.id
    })).$add("assignees", testAdmin))

    await ((await Card.create({
        name: "C",
        asWho: "Developer",
        task: "Test task",
        description: "Test description",
        dods: "Test dods",
        status: "REJECTED",
        workingDays: 5,
        lastPLDEdit: 0,
        actPLD: 0,
        sprintId: testSprint.id,
        partId: testPart.id
    })).$add("assignees", testAdmin))

    await ((await Card.create({
        name: "D",
        asWho: "Developer",
        task: "Test task",
        description: "Test description",
        dods: "Test dods",
        status: "WAITING_APPROVAL",
        workingDays: 6,
        lastPLDEdit: 0,
        actPLD: 0,
        sprintId: testSprint.id,
        partId: testPart.id
    })).$add("assignees", testAdmin))

    let rdv = await RendezVous.create({
        date: new Date(),
        agenda: "Test !",
        sheduling: "PLANNED"
    });

    for (const user of [testAdmin, testEditor, testMaintener]) {
        const userAppointment = await RendezVousUserAttendance.create();
        await Promise.all([
            userAppointment.$set('rendezVous', rdv),
            userAppointment.$set('user', user)
        ])
    }

    let rdv2 = await RendezVous.create({
        date: new Date(),
        agenda: "Test 2!",
        sheduling: "PASSED"
    })

    for (const user of [testAdmin, testEditor, testMaintener]) {
        const userAppointment = await RendezVousUserAttendance.create();
        await Promise.all([
            userAppointment.$set('rendezVous', rdv2),
            userAppointment.$set('user', user)
        ])
    }

    await testCard.$add('assignees', testAdmin);
    await testCard.$add('assignees', testMaintener);

    await closeDatabaseConnection();
    console.log("Starting.");
}