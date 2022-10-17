import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, BelongsTo, ForeignKey } from 'sequelize-typescript';
import Card from './card';

@Table({
    modelName: "DoD",
    tableName: "DoDs"
})
class DoD extends Model<DoD> {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    name: string;

    @ForeignKey(() => Card)
    @Column(DataType.INTEGER)
    cardId: number;

    @BelongsTo(() => Card)
    card: Card;

}

export default DoD;