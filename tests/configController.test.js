const request = require("supertest");
const { app, checkDatabaseConnection, closeDatabaseConnection } = require("../src/app");

describe("ConfigController", () => {

    let admin_token, admin_id;
    let editor_token, editor_id;
    let maintener_token, maintener_id;
    let user_token, user_id;

    beforeAll(async () => {
        await checkDatabaseConnection();
        let res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "ci_admin_account@domestia.fr",
                password: "ci"
            });
        admin_token = res.body.accessToken;
        admin_id = res.body.userId;
        res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "ci_editor_account@domestia.fr",
                password: "ci"
            });
        editor_token = res.body.accessToken;
        editor_id = res.body.userId;
        res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "ci_maintener_account@domestia.fr",
                password: "ci"
            });
        maintener_token = res.body.accessToken;
        maintener_id = res.body.userId;
        res = await request(app)
            .post("/api/auth/login")
            .send({
                email: "ci_user_account@domestia.fr",
                password: "ci"
            });
        user_token = res.body.accessToken;
        user_id = res.body.userId;
    })

    describe("Test list", () => {

        describe("Test errors", () => {

            it("should fail because of no connection", async () => {
                await checkAuthGET("/api/config", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/config", app, [
                    user_token,
                    maintener_token,
                    editor_token
                ]);
            })
        })

        it("should return the config", async () => {
            await performMultiplesAccountCheckGET("/api/config/", app, [
                admin_token
            ], (res, token) => {
                expect(res.statusCode).toBe(200)
                expect(res.body.config).toHaveProperty("SMTP_Host")
                expect(res.body.config).toHaveProperty("SMTP_User")
                expect(res.body.config).toHaveProperty("SMTP_Port")
                expect(res.body.config).toHaveProperty("SMTP_Password")
                expect(res.body.config).toHaveProperty("Default_Password")
                expect(res.body.config).toHaveProperty("Hostname")
                expect(res.body.config).toHaveProperty("UsingCustomGenerator")
                expect(res.body.config).toHaveProperty("UnderMaintenance")
            });
        });

    });

    describe("Test edit", () => {

        describe("Test errors", () => {

            it("should fail because of no connection", async () => {
                await checkAuthPOST("/api/config/edit", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthPOST("/api/config/edit", app, [
                    user_token,
                    maintener_token,
                    editor_token
                ]);
            })
        })

        it("should edit the config", async () => {
            let res = await request(app)
                .post("/api/config/edit")
                .set("Authorization", `Bearer ${admin_token}`)
                .send({
                    smtphost: "localhost",
                    smtpuser: "nobody",
                    smtpport: "12",
                    smtppassword: "nopass",
                    hostname: "test",
                    defaultPassword: "test",
                    underMaintenance: "false"
                })
            expect(res.statusCode).toBe(200)
        });

    });

    describe("Test refresh", () => {

        describe("Test errors", () => {

            it("should fail because of no connection", async () => {
                await checkAuthGET("/api/config/refresh", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/config/refresh", app, [
                    user_token,
                    maintener_token,
                    editor_token
                ]);
            })
        })

        it("should refresh the cache", async () => {
            await performMultiplesAccountCheckGET("/api/config/refresh", app, [
                admin_token
            ], (res, token) => {
                expect(res.statusCode).toBe(200)
            });
        });

    });

    afterAll(async () => {
        await closeDatabaseConnection();
    })
});