import { Model, Column, DataType, Default, AllowNull, Unique, Table, BelongsTo, HasMany, BelongsToMany, ForeignKey } from 'sequelize-typescript';
import CardUser from './cardUser';
import Part from './part';
import Sprint from './sprint';
import User from './user';

export type Status = "REJECTED"|"WAITING_APPROVAL"|"NOT_STARTED"|"STARTED"|"FINISHED";

@Table({
    modelName: "PLD",
    tableName: "PLDs"
})
class PLD extends Model<PLD> {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id: number;

    @Column(DataType.INTEGER)
    versionInSprint: number;

    @Column(DataType.STRING)
    path: string;

    @Column(DataType.STRING)
    downloadPath: string;

    @Column(DataType.TEXT)
    changesToPLD: string;

    @ForeignKey(() => Sprint)
    @Column(DataType.INTEGER)
    sprintId: number;

    @BelongsTo(() => Sprint)
    sprint: Sprint;

    toJSON() {
        const values = super.toJSON()
        delete values.deletedAt;
        delete values.createdAt;
        return values;
    }

}

export default PLD;