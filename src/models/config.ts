import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { generateRandomString } from '../utils/utils';

@Table({
    modelName: "Config",
    tableName: "Configs"
})
class Config extends Model<Config> {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id: number;

    @AllowNull(false)
    @Unique
    @Column(DataType.STRING)
    name: string;

    @Default(null)
    @Column(DataType.STRING)
    value: string;

    static async getSMTPHost() {
        return (await Config.findOrCreate({
            where: {
                name: "SMTP_HOST"
            }
        }))[0];
    }

    static async getSMTPUser() {
        return (await Config.findOrCreate({
            where: {
                name: "SMTP_USER"
            }
        }))[0];
    }

    static async getSMTPPort() {
        return (await Config.findOrCreate({
            where: {
                name: "SMTP_PORT"
            }
        }))[0];
    }

    static async getSMTPPassword() {
        return (await Config.findOrCreate({
            where: {
                name: "SMTP_PASSWORD"
            }
        }))[0];
    }

    static async getDefaultPassword() {
        return (await Config.findOrCreate({
            where: {
                name: "DEFAULT_PASSWORD"
            }
        }))[0];
    }

    static async getHostname() {
        return (await Config.findOrCreate({
            where: {
                name: "HOSTNAME"
            }
        }))[0];
    }

    static async getUsingCustomGenerator() {
        return (await Config.findOrCreate({
            where: {
                name: "USING_CUSTOM_GENERATOR"
            }
        }))[0];
    }

    static async getUnderMaintenance() {
        return (await Config.findOrCreate({
            where: {
                name: "UNDER_MAINTENANCE"
            }
        }))[0];
    }

    /* This failsafe is present when the Database is used for testing*/
    static async checkFailSafe() {
        return (await Config.findOne({
            where: {
                name: "TESTS_FAILSAFE_DISABLED",
                value: "TRUE"
            }
        }));
    }

    static async getADAInstanceId() {
        const config = await Config.findOne({
            where: {
                name: "ADA_INSTANCE_ID"
            }
        });
        if (!config) {
            return (await Config.create({
                name: "ADA_INSTANCE_ID",
                value: await generateRandomString(48)
            }))
        }
        return config;
    }

}

export default Config;