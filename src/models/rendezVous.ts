import { Op } from 'sequelize';
import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, BelongsToMany, BelongsTo, ForeignKey } from 'sequelize-typescript';
import RendezVousGroup from './rendezVousGroup';
import RendezVousUserAttendance from './rendezVousUserAttendance';

export type Sheduling = "PLANNED"|"PASSED";

@Table({
    modelName: "RendezVous",
    tableName: "RendezVouss"
})
class RendezVous extends Model<RendezVous> {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id: number;

    @AllowNull(false)
    @Column(DataType.DATE)
    date: Date;

    @Column(DataType.TEXT)
    agenda: string;

    @Column(DataType.TEXT)
    report: string;

    @Default("PLANNED")
    @Column(DataType.ENUM("PLANNED", "PASSED"))
    sheduling: Sheduling;

    @HasMany(() => RendezVousUserAttendance)
    userAttendances: RendezVousUserAttendance[];

    @ForeignKey(() => RendezVousGroup)
    @Column(DataType.INTEGER)
    rendezVousGroupId: number

    @BelongsTo(() => RendezVousGroup)
    rendezVousGroup: RendezVousGroup;

    @Column(DataType.INTEGER)
    duration: number;

    @Column(DataType.STRING)
    location: string;

    toJSON() {
        const values = super.toJSON()
        delete values.deletedAt;
        delete values.createdAt;
        delete values.updatedAt;
        return values;
    }
}

export default RendezVous;