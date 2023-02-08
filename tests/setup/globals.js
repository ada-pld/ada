const request = require("supertest");

global.checkAuthPOST = async (route, app, tokens) => {
    let res = await request(app)
        .post(route)
    expect(res.statusCode).toBe(401);
    for (const token of tokens) {
        res = await request(app)
            .post(route)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(403);
    }
}

global.checkAuthGET = async (route, app, tokens) => {
    let res = await request(app)
        .get(route)
    expect(res.statusCode).toBe(401);
    for (const token of tokens) {
        res = await request(app)
            .get(route)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(403);
    }
}

global.performMultiplesAccountCheckGET = async (route, app, tokens, fc) => {
    for (const token of tokens) {
        let res = await request(app)
            .get(route)
            .set('Authorization', `Bearer ${token}`)
        fc(res, token)
    }
}

global.performMultiplesAccountCheckPOST = async (route, app, tokens, fc) => {
    for (const token of tokens) {
        let res = await request(app)
            .post(route)
            .set('Authorization', `Bearer ${token}`)
        fc(res, token)
    }
}