import crypto from "crypto";
import axios from 'axios';

const publicKey =`-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAxJCCGEkSV7XhUuNQfIxi
9N0pOQCLFgcFLolnazHBFODiVOUfcqGvwm49od0w01iWXlsHUEHoVZfUagSnmIsC
uhoTvvnEgxZ2JlGShZZgLuQ9zaKdzbr7CGngCnyZvXGApETXY8F8Ra+nZzAJ+e2S
6Sgw8RbWk3G/N7JXxRjDJsJaRYBcRoeceh3MddPQJanAwM7uEsr9r0+/VcAiKrPD
0VPVJwpq+3xPXd5PyBttOe71ubnjXOnXL/7ZQ2397yS6hZidAfpKieGd5LrnwLEy
YVpPGqUMPV/kgtf6RE+0zBrEGeaMF70NCwppUDzqx8GmpSvlvLACV09BzoU3fJSe
2v06rdAwy5+JjEkGwNZxH5y7LKM4X8CCyMRSBLgkLEuB1+uCkLwS/cQwOdRXN7kc
cYQKvu+nLcExdz253kJsvPZ74yjA5lDwynALpS0k7XPUNZHtzWPOnpimFTzp4jFW
11EgTQEUW88hGEP4KmpiZD7oJUkhkB2ZJQjFc+SnQLy5Z3qfC+r8Sg8IMok0ov+6
6d+Ln2JdrH3GgD1t5BhrI+qqr+sFjhjtF+p8iHkf1mvNsCE1AhmqzP2iA/L15GAa
dILAf6Zn/V7/xhZVd3RuvCjyerhCoYc+opYfkWlNiHoXxnQQP552m5dLIfZ+eAnT
6IycQxpqc8lvucGoYrwovlECAwEAAQ==
-----END PUBLIC KEY-----`;

export function generateRandomString(len: number) : Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(len, function(err, buf) {
            if (err) reject(err);
            resolve(buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-'));
        })
    })
}

function generateKeyAndEncrypt(data): Promise<{encrypted: string, iv: string, generatedKey: Buffer}>{
    return new Promise(async (resolve, reject) => {
        const randomBytes = await generateRandomString(48);
        const randomBytesSalt = await generateRandomString(48);
        crypto.scrypt(randomBytes, randomBytesSalt, 32, (err, key) => {
            if (err) {
                reject(err);
                return;
            }
            crypto.randomFill(new Uint8Array(16), (err, iv: Uint8Array) => {
                let encrypted = '';
        
                const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
                cipher.setEncoding('base64');
                cipher.on('data', (chunk) => { encrypted += chunk});
                cipher.on('error', (error) => {reject(error)});
                cipher.on('end', () => {resolve({
                    encrypted: encrypted,
                    iv: Buffer.from(iv).toString('base64'),
                    generatedKey: key
                })});
                cipher.write(data);
                cipher.end();
            })
        })
    })
}

export function sendEvents(instanceId: string, analytics: any[], tries: number = 0) {
    if (instanceId == "OPT_OUT" || instanceId == null || tries == 3) {
        return;
    }
    const base64 = Buffer.from(JSON.stringify(analytics)).toString('base64');
    generateKeyAndEncrypt(base64).then(({encrypted, iv, generatedKey}) => {
        const key = crypto.publicEncrypt(publicKey, generatedKey).toString('base64');
        const toSend = {
            key: key,
            date: new Date(),
            iv: iv,
            encrypted: encrypted
        }
        const toSendFinal = Buffer.from(JSON.stringify(toSend)).toString('base64');
        axios.post(`http://localhost:4001/recolt?project=ADA&ADAInstanceId=${instanceId}`, {
            json: toSendFinal
        }).catch((_error) => {setTimeout(() => {sendEvents(instanceId, analytics, tries + 1)}, 10000)})
    }).catch((_error) => {})
}