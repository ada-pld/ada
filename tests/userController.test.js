const request = require("supertest");
const { app, checkDatabaseConnection, closeDatabaseConnection } = require("../src/app");

describe("AuthController", () => {

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
                await checkAuthGET("/api/users/list", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthGET("/api/users/list", app, [
                    user_token,
                    maintener_token
                ]);
            })
        })

        it("should return a list of users", async () => {
            await performMultiplesAccountCheckGET("/api/users/list", app, [
                editor_token,
                admin_token
            ], (res, token) => {
                console.log(token)
                console.log(res.body)
                expect(res.statusCode).toBe(200)
                expect(res.body.length).toBeGreaterThanOrEqual(4)
            });
        });

    });

    describe("Test create", () => {

        describe("Test errors", () => {

            it("should fail because of no connection", async () => {
                await checkAuthPOST("/api/users/create", app, []);
            });

            it ("should fail because of invalid permissions", async () => {
                await checkAuthPOST("/api/users/create", app, [
                    user_token,
                    maintener_token
                ]);
            })

            it("should fail because of an invalid body", async () => {
                let res = await request(app)
                    .post("/api/users/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        firstname: "",
                        lastname: "",
                        email: "",
                        password: "",
                        role: "",
                    })
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/users/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        firstname: "CI",
                        lastname: "ADMIN",
                        password: "TEST",
                        email: "testmail",
                        role: "USER",
                    })
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/users/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        firstname: "CI",
                        lastname: "ADMIN",
                        password: "TEST",
                        email: "testmail@gmail.com",
                        role: "gjflkgdfk",
                    })
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/users/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send()
                expect(res.statusCode).toBe(400);
            });

            it("should fail because email is already in use", async () => {
                let res = await request(app)
                    .post("/api/users/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        firstname: "TEST",
                        lastname: "TEST",
                        email: "ci_admin_account@domestia.fr",
                        role: "ADMIN"
                    })
                expect(res.statusCode).toBe(400);
            });

            it("should fail because of invalid permissions", async () => {
                let res = await request(app)
                    .post("/api/users/create")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        firstname: "TEST",
                        lastname: "TEST",
                        email: "TEST@test.com",
                        role: "ADMIN"
                    })
                expect(res.statusCode).toBe(403);
            });
        });

        it("should create two accounts as admin", async () => {
            let res = await request(app)
            .post("/api/users/create")
            .set("Authorization", `Bearer ${admin_token}`)
            .send({
                firstname: "test1",
                lastname: "test2",
                email: "test1@gmail.com",
                role: "ADMIN"
            })
            expect(res.statusCode).toBe(200);
            res = await request(app)
                .post("/api/users/create")
                .set("Authorization", `Bearer ${admin_token}`)
                .send({
                    firstname: "test1",
                    lastname: "test2",
                    email: "test2@gmail.com",
                    role: "EDITOR"
                })
            expect(res.statusCode).toBe(200);
        })

        it("should create one account as editor", async () => {
            let res = await request(app)
            .post("/api/users/create")
            .set("Authorization", `Bearer ${editor_token}`)
            .send({
                firstname: "test1",
                lastname: "test2",
                email: "test3@gmail.com",
                role: "EDITOR"
            })
            expect(res.statusCode).toBe(200);
        })
    })

    describe("Test edit", () => {

        describe("Test errors", () => {
            it("should fail because of no connection", async () => {
                await checkAuthPOST("/api/users/create", app, []);
            });

            it("should fail because of invalid body", async () => {
                let res = await request(app)
                    .post("/api/users/edit")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send();
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/users/edit")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        id: "invalid_id"
                    });
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/users/edit")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        id: user_id,
                        role: "HDFLKFHKJDHKL"
                    })
                expect(res.statusCode).toBe(400);
            });

            it("should fail because of invalid permissions as maintener", async () => {
                let res = await request(app)
                    .post("/api/users/edit")
                    .set("Authorization", `Bearer ${maintener_token}`)
                    .send({
                        id: user_id,
                        password: "test"
                    });
                expect(res.statusCode).toBe(403);
            })

            it("should fail because of invalid permissions as editor", async () => {
                let res = await request(app)
                    .post("/api/users/edit")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        id: admin_id,
                        password: "test"
                    });
                expect(res.statusCode).toBe(403);
                res = await request(app)
                    .post("/api/users/edit")
                    .set("Authorization", `Bearer ${editor_token}`)
                    .send({
                        id: editor_id,
                        role: "ADMIN"
                    });
                expect(res.statusCode).toBe(403);
            })
        });

        it("should edit the editor user", async () => {
            let res = await request(app)
                .post("/api/users/edit")
                .set("Authorization", `Bearer ${admin_token}`)
                .send({
                    id: editor_id,
                    firstname: "CHANGED"
                });
            expect(res.statusCode).toBe(200);
        })

        it("should edit the user user", async () => {
            let res = await request(app)
                .post("/api/users/edit")
                .set("Authorization", `Bearer ${editor_token}`)
                .send({
                    id: user_id,
                    firstname: "CHANGED",
                    password: "ci"
                })
            expect(res.statusCode).toBe(200);
        })

        it("should edit the user as an user", async () => {
            let res = await request(app)
                .post("/api/users/edit")
                .set("Authorization", `Bearer ${user_token}`)
                .send({
                    id: user_id,
                    password: "ci"
                });
            expect(res.statusCode).toBe(200);
        })

    });

    describe("Test forgotPassword", () => {

        describe("Test errors", () => {

            it("should fail because of invalid body", async () => {
                let res = await request(app)
                    .post("/api/users/forgotPassword")
                    .send();
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/users/forgotPassword")
                    .send({
                        email: ""
                    })
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/users/forgotPassword")
                    .send({
                        email: "testmail"
                    })
                expect(res.statusCode).toBe(400);
            })

            it("should fail because the mailTransporter isn't setup", async () => {
                let res = await request(app)
                    .post("/api/users/forgotPassword")
                    .send({
                        email: "ci_admin_account@domestia.fr"
                    });
                expect(res.statusCode).toBe(409);
            });
        })

        it.skip("should work", async () => {
            let res = await request(app)
                .post("/api/users/forgotPassword")
                .send({
                    email: "ci_admin_account@domestia.fr"
                });
            expect(res.statusCode).toBe(200);
        });
    })

    afterAll(async () => {
        await closeDatabaseConnection();
    })
});