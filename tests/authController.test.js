const request = require("supertest");
const { app, checkDatabaseConnection, closeDatabaseConnection } = require("../src/app");

describe("AuthController", () => {

    beforeAll(async () => {

        await checkDatabaseConnection();
    })

    describe("Test login", () => {

        describe("Test errors", () => {

            it("should fail because of missing credentials", async () => {
                let res = await request(app)
                    .post('/api/auth/login')
                    .send();
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/auth/login")
                    .send({
                        email: "testmail@testmail.xyz"
                    });
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .post("/api/auth/login")
                    .send({
                        password: "example_password"
                    });
                expect(res.statusCode).toBe(400);
            });

            it("should fail because of invalid credentials", async () => {
                let res = await request(app)
                    .post("/api/auth/login")
                    .send({
                        email: "unknown_mail@unknownmail.xyz",
                        password: "example_password"
                    });
                expect(res.statusCode).toBe(401);
                res = await request(app)
                    .post("/api/auth/login")
                    .send({
                        email: "ci_admin_account@domestia.fr",
                        password: "invalid_password"
                    });
                expect(res.statusCode).toBe(401);
            });
        });

        it("should login the ci admin account", async () => {
            let res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "ci_admin_account@domestia.fr",
                    password: "ci"
                });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("userId");
            expect(res.body).toHaveProperty("accessToken");
            expect(res.body).toHaveProperty("refreshToken");
        });
    });

    describe("Test refresh token", () => {

        let userId, accessToken, refreshToken;

        beforeAll(async () => {
            let res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "ci_admin_account@domestia.fr",
                    password: "ci"
                });
            userId = res.body.userId;
            accessToken = res.body.accessToken;
            refreshToken = res.body.refreshToken;
        })

        describe("Test errors", () => {
            
            it("should fail because of missing elements in body", async () => {
                let res = await request(app)
                    .get("/api/auth/refreshToken")
                    .query();
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .get("/api/auth/refreshToken")
                    .query({
                        refreshToken: refreshToken
                    })
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .get("/api/auth/refreshToken")
                    .query({
                        userId: userId
                    });
                expect(res.statusCode).toBe(400);
            });

            it("should fail because userId is not linked to refreshToken", async () => {
                let res = await request(app)
                    .get("/api/auth/refreshToken")
                    .query({
                        refreshToken: refreshToken,
                        userId: "invalidId"
                    });
                expect(res.statusCode).toBe(400);
                res = await request(app)
                    .get("/api/auth/refreshToken")
                    .query({
                        refreshToken: "invalidRefreshToken",
                        userId: userId
                    });
                expect(res.statusCode).toBe(400);
            })

            it.skip("should fail because the token is expired", async () => {
                let res = await request(app)
                    .get("/api/auth/refreshToken")
                    .query({
                        refreshToken: refreshToken,
                        userId: userId
                    })
            })
        });

        it("should refresh the access token", async () => {
            let res = await request(app)
                .get("/api/auth/refreshToken")
                .query({
                    refreshToken: refreshToken,
                    userId: userId
                });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("accessToken");
            expect(res.body).toHaveProperty("refreshToken");
        })
    });

    describe("Test logout", () => {

        let userId, accessToken, refreshToken;

        beforeAll(async () => {
            let res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "ci_admin_account@domestia.fr",
                    password: "ci"
                })
            userId = res.body.userId;
            accessToken = res.body.accessToken;
            refreshToken = res.body.refreshToken;
        })

        describe("Test errors", () => {

            it("should fail because no token is provided", async () => {
                let res = await request(app)
                    .get("/api/auth/logout")
                    .query();
                expect(res.statusCode).toBe(400);
            })

            it ("should fail because accessToken is invalid", async () => {
                let res = await request(app)
                    .get("/api/auth/logout")
                    .query({
                        token: "invalid_token"
                    });
                expect(res.statusCode).toBe(400);
            })
        })

        it("should logout", async () => {
            let res = await request(app)
                .get("/api/auth/logout")
                .query({
                    token: accessToken
                });
            expect(res.statusCode).toBe(200);
        })
    })

    describe("Test CheckToken", () => {

        let userId, accessToken, refreshToken;

        beforeAll(async () => {
            let res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "ci_admin_account@domestia.fr",
                    password: "ci"
                })
            userId = res.body.userId;
            accessToken = res.body.accessToken;
            refreshToken = res.body.refreshToken;
        });

        describe("Test errors", () => {

            it("should fail because no token is provided", async () => {
                let res = await request(app)
                    .get("/api/auth/checkToken")
                    .query();
                expect(res.statusCode).toBe(400);
            })

            it("should fail because an invalid token is provided", async () => {
                let res = await request(app)
                    .get("/api/auth/checkToken")
                    .query({
                        token: "Invalid token"
                    });
                expect(res.statusCode).toBe(400);
            })

            it.skip("should fail because the access token is expired", async () => {
                let res = await request(app)
                    .get("/api/auth/checkToken")
                    .query({
                        token: accessToken
                    });
                expect(res.statusCode).toBe(401);
            })
        });

        it("should say the token is valid", async () => {
            let res = await request(app)
                .get("/api/auth/checkToken")
                .query({
                    token: accessToken
                });
            expect(res.statusCode).toBe(200);
        })
    })
    
    afterAll(async () => {
        await closeDatabaseConnection();
    })
})