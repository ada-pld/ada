import { app, checkDatabaseConnection, createDefaultAccount } from "./app";

(async () => {
    await checkDatabaseConnection();
    await createDefaultAccount();

    app.listen(parseInt(process.env.PORT), () => {
        console.log(`Server launched on port ${process.env.PORT}`)
    })
})();