import { app, checkDatabaseConnection } from "./app";
import { setup } from "./mails";

(async () => {
    await checkDatabaseConnection();
    await setup();

    app.listen(parseInt(process.env.PORT), () => {
        console.log(`Server launched on port ${process.env.PORT}`)
    })
})();