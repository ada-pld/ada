const request = require("supertest");
const { app, checkDatabaseConnection, closeDatabaseConnection } = require("../src/app");
const { default: RendezVous } = require("../src/models/rendezVous");

describe("RendezVousController", () => {

    let admin_token, admin_id;
    let editor_token, editor_id;
    let maintener_token, maintener_id;
    let user_token, user_id;
    let rendezVousId;

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
        rendezVousId = (await RendezVous.findOne({
            where: {
                sheduling: "PLANNED"
            }
        })).id;
    })

    describe("Test list", () => {

        describe("Test errors", () => {

            it("should fail because of no connection", async () => {
                await checkAuthGET("/api/rendezVous/list", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/rendezVous/list", app, [
                    user_token
                ]);
            })
        })

        it("should return a list of rendezVous", async () => {
            await performMultiplesAccountCheckGET("/api/rendezVous/list", app, [
                maintener_token,
                editor_token,
                admin_token
            ], (res, token) => {
                expect(res.statusCode).toBe(200)
                if (token == maintener_token) {
                    if (res.body[0].sheduling == "PASSED") {
                        expect(res.body[0]).toHaveProperty("report");
                        expect(res.body[1]).not.toHaveProperty("report");
                    } else {
                        expect(res.body[0]).not.toHaveProperty("report");
                        expect(res.body[1]).toHaveProperty("report");
                    }
                } else {
                    expect(res.body[0]).toHaveProperty("report");
                    expect(res.body[1]).toHaveProperty("report");
                }
            });
        });

    });

    describe("Test create", () => {

        describe("Test errors", () => {

            it("should fail because of no connection", async () => {
                await checkAuthPOST("/api/rendezVous/create", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthPOST("/api/rendezVous/create", app, [
                    user_token,
                    maintener_token
                ]);
            })

            it("should fail because of an invalid body", async () => {
                let res = await request(app)
                    .post("/api/rendezVous/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        date: "",
                        agenda: "",
                    })
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/rendezVous/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        date: "fhsgkjfhgslkdjgb",
                        agenda: "Coucou !"
                    })
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/rendezVous/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send()
                expect(res.statusCode).toBe(400);
            });
        });

        it("should create a rendezVous as editor", async () => {
            let res = await request(app)
                .post("/api/rendezVous/create")
                .set("Authorization", `Bearer ${editor_token}`)
                .send({
                    date: "Fri Feb 10 2023 11:41:50 GMT+0000 (Greenwich Mean Time)",
                    agenda: "Test agenda !",
                })
            expect(res.statusCode).toBe(200);
        })

        it("should create a rendezVous as admin", async () => {
            let res = await request(app)
                .post("/api/rendezVous/create")
                .set("Authorization", `Bearer ${admin_token}`)
                .send({
                    date: "Fri Feb 10 2023 11:41:50 GMT+0000 (Greenwich Mean Time)",
                    agenda: "Test agenda 2 !",
                })
            expect(res.statusCode).toBe(200);
        })
    })

    describe("Test one", () => {

        describe("Test errors", () => {
            it("should fail because of no connection", async () => {
                await checkAuthGET("/api/rendezVous/1", app, []);
            });
            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/rendezVous/1", app, [
                    user_token
                ]);
            })
            it("should fail because of no id", async () => {
                let res = await request(app)
                    .get("/api/rendezVous/")
                    .set("Authorization", `Bearer ${maintener_token}`)
                expect(res.statusCode).toBe(404);
            })
            it("should fail because of invalid id", async () => {
                let res = await request(app)
                    .get("/api/rendezVous/fhdjskfd")
                    .set("Authorization", `Bearer ${maintener_token}`)
                expect(res.statusCode).toBe(400);
            })
        })

        it("should return a rendezVous", async () => {
            await performMultiplesAccountCheckGET(`/api/rendezVous/${rendezVousId}`, app, [
                maintener_token,
                editor_token,
                admin_token
            ], (res, token) => {
                expect(res.statusCode).toBe(200)
                if (token == maintener_token) {
                    expect(res.body).not.toHaveProperty("report");
                } else {
                    expect(res.body).toHaveProperty("report");
                }
            });
        });
    })

    describe("Test edit", () => {

        describe("Test errors", () => {
            it("should fail because of no connection", async () => {
                await checkAuthPOST("/api/rendezVous/edit", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthPOST("/api/rendezVous/edit", app, [
                    user_token,
                    maintener_token,
                ]);
            })

            it("should fail because of invalid body", async () => {
                let res = await request(app)
                    .post("/api/rendezVous/edit")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        id: "invalid_id"
                    });
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/rendezVous/edit")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        id: rendezVousId,
                        date: "HDFLKFHKJDHKL"
                    })
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/rendezVous/edit")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send()
                expect(res.statusCode).toBe(400);
            });
        });

        it("should mark the rendezVous as passed", async () => {
            let res = await request(app)
                .post("/api/rendezVous/edit")
                .set("Authorization", `Bearer ${editor_token}`)
                .send({
                    id: rendezVousId,
                    passed: "true",
                    presence_1: "present",
                    presence_2: "na",
                    presence_3: "absent"
                });
            expect(res.statusCode).toBe(200);
            let rendezVous = await RendezVous.findOne({
                where: {
                    id: rendezVousId
                }
            });
            expect(rendezVous.sheduling).toBe("PASSED");
        })

        it("should edit the rendezVous", async () => {
            let res = await request(app)
                .post("/api/rendezVous/edit")
                .set("Authorization", `Bearer ${admin_token}`)
                .send({
                    id: rendezVousId,
                    date: "Fri Feb 11 2023 11:41:50 GMT+0000 (Greenwich Mean Time)",
                    agenda: "Test EDIT",
                    report: "Test EDIT !"
                });
            expect(res.statusCode).toBe(200);
            let rendezVous = await RendezVous.findOne({
                where: {
                    id: rendezVousId
                }
            });
            expect(rendezVous.agenda).toBe("Test EDIT");
            expect(rendezVous.report).toBe("Test EDIT !");
            expect(rendezVous.date.getDate()).toBe(11);
        })

        it("should not edit the rendezVous sheduling", async () => {
            let res = await request(app)
                .post("/api/rendezVous/edit")
                .set("Authorization", `Bearer ${editor_token}`)
                .send({
                    id: rendezVousId,
                    passed: "false"
                });
            expect(res.statusCode).toBe(200);
            let rendezVous = await RendezVous.findOne({
                where: {
                    id: rendezVousId
                }
            });
            expect(rendezVous.sheduling).toBe("PASSED");
        })
    });

    afterAll(async () => {
        await closeDatabaseConnection();
    })
});