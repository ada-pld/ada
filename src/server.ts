import { app, checkDatabaseConnection } from "./app";
import { setupMailTransporter } from "./mails";

(async () => {
    await checkDatabaseConnection();
    await setupMailTransporter();

    app.listen(parseInt(process.env.PORT), () => {
        console.log(`Server launched on port ${process.env.PORT}`)
    })
})();