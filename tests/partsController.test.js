const request = require("supertest");
const { app, checkDatabaseConnection, closeDatabaseConnection } = require("../src/app");

describe("PartsController", () => {

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
                await checkAuthGET("/api/parts/list", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/parts/list", app, [
                    user_token,
                    maintener_token
                ]);
            })
        })

        it("should return a list of parts", async () => {
            await performMultiplesAccountCheckGET("/api/parts/list", app, [
                editor_token,
                admin_token
            ], (res, token) => {
                expect(res.statusCode).toBe(200)
                expect(res.body.length).toBeGreaterThanOrEqual(1)
            });
        });

    });

    describe("Test create", () => {

        describe("Test errors", () => {

            it("should fail because of no connection", async () => {
                await checkAuthPOST("/api/parts/create", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthPOST("/api/parts/create", app, [
                    user_token,
                    maintener_token
                ]);
            })

            it("should fail because of an invalid body", async () => {
                let res = await request(app)
                    .post("/api/parts/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send()
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/parts/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        name: ""
                    });
                expect(res.statusCode).toBe(400);
            });

            it("should fail because name is already in use", async () => {
                let res = await request(app)
                    .post("/api/parts/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        name: "TEST"
                    })
                expect(res.statusCode).toBe(400);
            });
        });

        it("should create one part as admin", async () => {
            let res = await request(app)
            .post("/api/parts/create")
            .set("Authorization", `Bearer ${admin_token}`)
            .send({
                name: "TEST1"
            })
            expect(res.statusCode).toBe(200);
        })

        it("should create one part as editor", async () => {
            let res = await request(app)
                .post("/api/parts/create")
                .set("Authorization", `Bearer ${editor_token}`)
                .send({
                    name: "TEST2"
                })
            expect(res.statusCode).toBe(200);
        })
    })

    afterAll(async () => {
        await closeDatabaseConnection();
    })
});