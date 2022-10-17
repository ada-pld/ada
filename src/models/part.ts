import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany } from 'sequelize-typescript';
import Card from './card';

@Table({
    modelName: "Part",
    tableName: "Parts"
})
class Part extends Model<Part> {

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

    @HasMany(() => Card)
    cards: Card[];

}

export default Part;