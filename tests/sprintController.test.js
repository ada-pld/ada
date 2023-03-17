const request = require("supertest");
const { app, checkDatabaseConnection, closeDatabaseConnection } = require("../src/app");
const { default: Sprint } = require("../src/models/sprint");

describe("SprintController", () => {

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
                await checkAuthGET("/api/sprint/list", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/sprint/list", app, [
                    user_token
                ]);
            })
        })

        it("should return a list of sprints", async () => {
            await performMultiplesAccountCheckGET("/api/sprint/list", app, [
                editor_token,
                admin_token
            ], (res, token) => {
                expect(res.statusCode).toBe(200)
                expect(res.body.length).toBe(2)
                expect(res.body[0].name).toBe("Sprint test")
                expect(res.body[1].name).toBe("Sprint test 2")
            });
        });

    });

    describe("Test create", () => {

        describe("Test errors", () => {

            it("should fail because of no connection", async () => {
                await checkAuthPOST("/api/sprint/create", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthPOST("/api/sprint/create", app, [
                    user_token,
                    maintener_token
                ]);
            })

            it("should fail because of an invalid body", async () => {
                let res = await request(app)
                    .post("/api/sprint/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send()
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/sprint/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        name: "",
                        workDaysNeeded: 12
                    });
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/sprint/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        name: "Coucou"
                    });
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/sprint/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        name: "Coucou",
                        workDaysNeeded: "lol"
                    });
                expect(res.statusCode).toBe(400);
            });

            it("should fail because name is already in use", async () => {
                let res = await request(app)
                    .post("/api/sprint/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        name: "Sprint test",
                        workDaysNeeded: 14
                    })
                expect(res.statusCode).toBe(400);
            });
        });

        it("should create one sprint as admin", async () => {
            let res = await request(app)
                .post("/api/sprint/create")
                .set("Authorization", `Bearer ${admin_token}`)
                .send({
                    name: "Test 1",
                    workDaysNeeded: 32
                })
            expect(res.statusCode).toBe(200);
        })

        it("should create one sprint as editor", async () => {
            let res = await request(app)
                .post("/api/sprint/create")
                .set("Authorization", `Bearer ${editor_token}`)
                .send({
                    name: "Test 2",
                    workDaysNeeded: 32
                })
            expect(res.statusCode).toBe(200);
        })
    })

    describe("Test active", () => {

        describe("Test errors", () => {
            it("should fail because of no connection", async () => {
                await checkAuthPOST("/api/sprint/create", app, []);
            });
        })

        it("should return the active sprint", async () => {
            await performMultiplesAccountCheckGET("/api/sprint/active", app, [
                maintener_token,
                editor_token,
                admin_token
            ], (res, token) => {
                expect(res.statusCode).toBe(200)
                expect(res.body.name).toBe("Sprint test")
                expect(res.body.active).toBe(true)
            });
        })

    })

    describe("Test use", () => {
        describe("Test errors", () => {
            it("should fail because of no connection", async () => {
                await checkAuthGET("/api/sprint/use/1", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/sprint/use/1", app, [
                    user_token,
                    maintener_token
                ]);
            })

            it("should fail because of invalid body", async () => {
                let res = await request(app)
                    .get(`/api/sprint/use/`)
                    .set("Authorization", `Bearer ${editor_token}`)
                expect(res.statusCode).toBe(404)
                res = await request(app)
                    .get(`/api/sprint/use/hjhskfjs`)
                    .set("Authorization", `Bearer ${editor_token}`)
                expect(res.statusCode).toBe(400)
            })
        })

        it("should change the active sprint", async () => {
            let res = await request(app)
                .get(`/api/sprint/use/2`)
                .set("Authorization", `Bearer ${editor_token}`)
            expect(res.statusCode).toBe(200)
            expect((await Sprint.findAll({where: {active: true}})).length).toBe(1)
            expect((await Sprint.findOne({where: {active: true}})).id).toBe(2)
            res = await request(app)
                .get(`/api/sprint/use/1`)
                .set("Authorization", `Bearer ${admin_token}`)
            expect(res.statusCode).toBe(200)
            expect((await Sprint.findOne({where: {active: true}})).id).toBe(1)
        })
    })

    describe("Tet cardsStats", () => {

        describe("Test errors", () => {
            it("should fail because of no connection", async () => {
                await checkAuthGET("/api/sprint/cardStats", app, []);
            });
    
            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/sprint/cardStats", app, [
                    user_token
                ]);
            })
        })

        it("Should returns the correct card stats on an empty sprint", async () => {
            await request(app)
                .get("/api/sprint/use/2")
                .set("Authorization", `Bearer ${admin_token}`)
            await performMultiplesAccountCheckGET("/api/sprint/cardStats", app, [
                maintener_token,
                editor_token,
                admin_token
            ], (res, token) => {
                console.log("body next!")
                console.log(res.body)
                expect(res.statusCode).toBe(200)
                expect(res.body.length).toBeGreaterThanOrEqual(3)
                for (let i = 0; i < 3; i++) {
                    expect(res.body[i].JHIntended).toBe(0)
                    expect(res.body[i].JHDones).toBe(0)
                    expect(res.body[i].JHInProgress).toBe(0)
                    expect(res.body[i].JHNotStarted).toBe(0)
                    expect(res.body[i].JHNotAccepted).toBe(0)
                    expect(res.body[i].JHMissing).toBe(24)
                    expect(res.body[i].cards.length).toBe(0)
                }
            });
        })

        it("Should returns the card stats of the sprint", async () => {
            await request(app)
                .get("/api/sprint/use/1")
                .set("Authorization", `Bearer ${admin_token}`)
            await performMultiplesAccountCheckGET("/api/sprint/cardStats", app, [
                maintener_token,
                editor_token,
                admin_token
            ], (res, token) => {
                expect(res.statusCode).toBe(200)
                expect(res.body.length).toBeGreaterThanOrEqual(3)
                for (let i = 0; i < 3; i++) {
                    if (res.body[i].role == "ADMIN") {
                        expect(res.body[i].JHIntended).toBe(7.5)
                        expect(res.body[i].JHDones).toBe(0.5)
                        expect(res.body[i].JHInProgress).toBe(3)
                        expect(res.body[i].JHNotStarted).toBe(4)
                        expect(res.body[i].JHNotAccepted).toBe(11)
                        expect(res.body[i].JHMissing).toBe(4.5)
                        expect(res.body[i].cards.length).toBe(5)
                    } else if (res.body[i].role == "MAINTENER") {
                        expect(res.body[i].JHIntended).toBe(0.5)
                        expect(res.body[i].JHDones).toBe(0.5)
                        expect(res.body[i].JHInProgress).toBe(0)
                        expect(res.body[i].JHNotStarted).toBe(0)
                        expect(res.body[i].JHNotAccepted).toBe(0)
                        expect(res.body[i].JHMissing).toBe(11.5)
                        expect(res.body[i].cards.length).toBe(1)
                    }
                }
            });
        })
        
    })

    afterAll(async () => {
        await closeDatabaseConnection();
    })
});