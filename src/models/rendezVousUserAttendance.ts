import { Op } from 'sequelize';
import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, BelongsToMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import RendezVous from './rendezVous';
import User from './user';

export type Attendance = "UNDEFINED"|"PRESENT"|"ABSENT";

@Table({
    modelName: "RendezVousUserAttendance",
    tableName: "RendezVousUserAttendances"
})
class RendezVousUserAttendance extends Model<RendezVousUserAttendance> {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id: number;

    @ForeignKey(() => RendezVous)
    @Column(DataType.INTEGER)
    rendezVousId: number;

    @BelongsTo(() => RendezVous)
    rendezVous: RendezVous;

    @ForeignKey(() => User)
    @Column(DataType.UUID)
    userId: string;

    @BelongsTo(() => User)
    user: User;

    @Default("UNDEFINED")
    @Column(DataType.ENUM("UNDEFINED", "PRESENT", "ABSENT"))
    attendance: Attendance;

    toJSON() {
        const values = super.toJSON()
        delete values.deletedAt;
        delete values.createdAt;
        return values;
    }

}

export default RendezVousUserAttendance;