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

    toJSON() {
        const values = super.toJSON()
        delete values.deletedAt;
        delete values.createdAt;
        return values;
    }

}

export default Part;