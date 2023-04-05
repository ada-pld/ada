import { app, checkDatabaseConnection } from "./app";
import { setupMailTransporter } from "./mails";
import User from "./models/user";
import bcrypt from "bcrypt";

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