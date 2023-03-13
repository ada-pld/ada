import { Op } from 'sequelize';
import { Model, Column, DataType, Default, AllowNull, Unique, Table, HasMany, BelongsToMany } from 'sequelize-typescript';
import RendezVous from './rendezVous';
import RendezVousUserAttendance from './rendezVousUserAttendance';

@Table({
    modelName: "RendezVousGroup",
    tableName: "RendezVousGroups"
})
class RendezVousGroup extends Model<RendezVousGroup> {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    groupName: string;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    groupColor: number;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    typicalDuration: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    typicalLocation: string;

    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    PLDMustBeGenerated: boolean;

    @HasMany(() => RendezVous)
    rendezVouss: RendezVous[];

    toJSON() {
        const values = super.toJSON()
        delete values.deletedAt;
        delete values.createdAt;
        delete values.updatedAt;
        return values;
    }
}

export default RendezVousGroup;