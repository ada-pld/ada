import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, BelongsToMany } from 'sequelize-typescript';
import Card from './card';
import CardUser from './cardUser';

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

}

export default User;