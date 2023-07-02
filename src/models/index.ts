import * as db_config from "../database_configs/db_config";
import { Sequelize} from "sequelize-typescript";
import Card from "./card";
import CardUser from "./cardUser";
import Config from "./config";
import Part from "./part";
import PLD from "./pld";
import RendezVous from "./rendezVous";
import RendezVousUserAttendance from "./rendezVousUserAttendance";
import Session from "./session";
import Sprint from "./sprint";
import User from "./user";
import RendezVousGroup from "./rendezVousGroup";

const sequelize = new Sequelize({
    host: db_config[process.env.NODE_ENV].host,
    port: db_config[process.env.NODE_ENV].port,
    database: db_config[process.env.NODE_ENV].database,
    username: db_config[process.env.NODE_ENV].username,
    password: db_config[process.env.NODE_ENV].password,
    dialect: "mysql",
    logging: process.env.ENVIRONMENT != "dev" && process.env.ENVIRONMENT != "test" ? false : console.log,
    models: [
        User,
        Sprint,
        Part,
        Card,
        CardUser,
        Config,
        PLD,
        RendezVous,
        RendezVousUserAttendance,
        RendezVousGroup,
        Session,
    ]
});

export default sequelize;