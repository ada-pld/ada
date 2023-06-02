import "dotenv/config";

(async () => {
    if (process.env.NODE_ENV == 'test') {
        const { app_test, checkDatabaseConnection_test } = await import('./app.test');
        const { setupMailTransporter } = await import('./mails');
        const User = (await import('./models/user')).default;
        const bcrypt = await import('bcrypt');

        (async () => {
            await checkDatabaseConnection_test();

            app_test.get('/start_tests', async (req, res) => {
                await checkDatabaseConnection_test();
                return res.status(200).send({
                    message: "Database ready."
                })
            })

            app_test.listen(parseInt(process.env.PORT), () => {
                console.log(`Test Server launched on port ${process.env.PORT}`)
            })
        })();
    } else {
        const { app, checkDatabaseConnection } = await import('./app');
        const { setupMailTransporter } = await import('./mails');
        const User = (await import('./models/user')).default;
        const bcrypt = await import('bcrypt');

        (async () => {
            await checkDatabaseConnection();
            await setupMailTransporter();

            if (process.env.RESET_ADMINS_PASSWORD == "true") {
                (await User.findAll({
                    where: {
                        role: "ADMIN"
                    }
                })).forEach(async (user) => {
                    console.log(`Reseting password for ${user.email}`)
                    user.password = bcrypt.hashSync("password", 10);
                    await user.save();
                })
            }

            app.listen(parseInt(process.env.PORT), () => {
                console.log(`Server launched on port ${process.env.PORT}`)
            })
        })();
    }
})();