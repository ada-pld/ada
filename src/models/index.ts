import { Sequelize} from "sequelize-typescript";
import Card from "./card";
import CardUser from "./cardUser";
import Config from "./config";
import Part from "./part";
import Sprint from "./sprint";
import User from "./user";

const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: "mysql",
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    logging: process.env.ENVIRONMENT != "dev" ? false : console.log,
    models: [
        User,
        Sprint,
        Part,
        Card,
        CardUser,
        Config,
    ]
});

export default sequelize;