import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, ForeignKey } from 'sequelize-typescript';
import Card from './card';
import User from './user';

@Table({
    modelName: "CardUser",
    tableName: "CardUsers"
})
class CardUser extends Model<CardUser> {

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

    @ForeignKey(() => Card)
    @Column(DataType.INTEGER)
    cardId: number;

    toJSON() {
        const values = super.toJSON()
        delete values.deletedAt;
        delete values.createdAt;
        return values;
    }

}

export default CardUser;