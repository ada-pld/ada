import crypto from "crypto";

export function generateRandomString(len: number) : Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(len, function(err, buf) {
            if (err) reject(err);
            resolve(buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-'));
        })
    })
}