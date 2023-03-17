import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, BelongsTo, ForeignKey } from 'sequelize-typescript';
import User from './user';

@Table({
    modelName: "Session",
    tableName: "Sessions"
})
class Session extends Model<Session> {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id: number;

    @ForeignKey(() => User)
    @Column(DataType.UUID)
    userId: string;

    @BelongsTo(() => User)
    user: User;

    @AllowNull(false)
    @Unique(true)
    @Column(DataType.STRING)
    accessToken: string;

    @AllowNull(false)
    @Unique(true)
    @Column(DataType.STRING)
    refreshToken: string;

    @AllowNull(false)
    @Column(DataType.BIGINT)
    accessTokenExpires: number;

    @AllowNull(false)
    @Column(DataType.BIGINT)
    refreshTokenExpires: number;

}

export default Session;