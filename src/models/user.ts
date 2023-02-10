import { Op } from 'sequelize';
import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, BelongsToMany } from 'sequelize-typescript';
import { FindOptions, Attributes } from "sequelize/types/model";
import Card from './card';
import CardUser from './cardUser';
import RendezVousUserAttendance from './rendezVousUserAttendance';

export type Role = "ADMIN"|"EDITOR"|"MAINTENER"|"USER";

@Table({
    modelName: "User",
    tableName: "Users"
})
class User extends Model<User> {

    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
        allowNull: false
    })
    id: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    firstname: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    lastname: string;

    @AllowNull(false)
    @Unique
    @Column(DataType.STRING)
    email: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    password: string;

    @Default("USER")
    @Column(DataType.ENUM("ADMIN", "EDITOR", "MAINTENER", "USER"))
    role: Role;

    @BelongsToMany(() => Card, () => CardUser)
    cards: Card[];

    @Default(true)
    @Column(DataType.BOOLEAN)
    isDefaultPassword: boolean;

    @HasMany(() => RendezVousUserAttendance)
    rendezVousAttendances: RendezVousUserAttendance[];

    static generateRandomPassword() {
        const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const specials = "#!^@_";
        let password = "";
        for (let i = 0; i < 7; i++) {
            password += characters[Math.floor(Math.random() * characters.length)];
        }
        password += specials[Math.floor(Math.random() * specials.length)];
        return password;
    }

    static async getEditorAndAdmins() {
        return this.findAll({
            where: {
                role: {
                    [Op.in]: ["ADMIN", "EDITOR"]
                }
            }
        })
    }

    static async findAllSafe(options?: FindOptions<Attributes<User>>) {
        return this.findAll({
            attributes: ['id', 'firstname', 'lastname', 'email', 'role'],
            ...options
        });
    }

    static isEmailAlreadyUsed(email: string) : Promise<boolean>{
        return new Promise(async (resolve, reject) => {
            User.count({where: {email: email}})
                .then((number) => {
                    resolve(number > 0)
                })
                .catch((err) => {
                    reject(err)
                });
        })
    }

    static getById(id: string) {
        return User.findOne({
            where: {
                id: id
            }
        });
    }

    toJSON() {
        const values = super.toJSON();
        delete values.password;
        delete values.isDefaultPassword;
        delete values.deletedAt;
        delete values.createdAt
        return values;
    }

}

export default User;