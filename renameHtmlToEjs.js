const { join, extname, basename } = require('path');
const { readdirSync, renameSync } = require('fs');

const files = readdirSync('./mails/build/');
for (const file of files) {
    const ext = extname(file);
    const new_name = basename(file, ext) + '.ejs';
    renameSync(join('./mails/build', file), join('./mails/build', new_name));
}