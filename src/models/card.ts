import { Model, Column, DataType, Default, AllowNull, Unique, Table, BelongsTo, HasMany, BelongsToMany, ForeignKey } from 'sequelize-typescript';
import CardUser from './cardUser';
import Part from './part';
import Sprint from './sprint';
import User from './user';

export type Status = "REJECTED"|"WAITING_APPROVAL"|"NOT_STARTED"|"STARTED"|"FINISHED";

@Table({
    modelName: "Card",
    tableName: "Cards"
})
class Card extends Model<Card> {

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    })
    id: number;

    @Default(1)
    @Column(DataType.INTEGER)
    version: number;

    @Default(-1)
    @Column(DataType.INTEGER)
    idInSprint: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    name: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    asWho: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    task: string;

    @AllowNull(false)
    @Column(DataType.TEXT)
    description: string;

    @AllowNull(false)
    @Default("")
    @Column(DataType.TEXT)
    dods: string;

    @Default(0)
    @Column(DataType.INTEGER)
    workingDays: number;

    @Default("WAITING_APPROVAL")
    @Column(DataType.ENUM("REJECTED", "WAITING_APPROVAL", "NOT_STARTED", "STARTED", "FINISHED"))
    status: Status;

    @BelongsToMany(() => User, () => CardUser)
    assignees: User[];

    @ForeignKey(() => Sprint)
    @Column(DataType.INTEGER)
    sprintId: number;

    @BelongsTo(() => Sprint)
    sprint: Sprint;

    @ForeignKey(() => Part)
    @Column(DataType.INTEGER)
    partId: number;

    @BelongsTo(() => Part)
    part: Part;

}

export default Card;