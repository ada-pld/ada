import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany } from 'sequelize-typescript';
import Card from './card';
import PLD from './pld';

@Table({
    modelName: "Sprint",
    tableName: "Sprints"
})
class Sprint extends Model<Sprint> {

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

    @AllowNull(false)
    @Column(DataType.INTEGER)
    workDaysNeeded: number;

    @Default(false)
    @Column(DataType.BOOLEAN)
    active: Boolean;

    @HasMany(() => Card)
    cards: Card[];

    @HasMany(() => PLD)
    plds: PLD[];

    toJSON() {
        const values = super.toJSON()
        delete values.deletedAt;
        delete values.createdAt;
        delete values.updatedAt;
        return values;
    }

}

export default Sprint;