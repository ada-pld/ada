import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addConstraint('RendezVousUserAttendances', {
                    fields: ['rendezVousId'],
                    type: 'foreign key',
                    references: {
                        table: 'RendezVouss',
                        field: 'id'
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                    transaction: transaction
                }),
                queryInterface.addConstraint('RendezVousUserAttendances', {
                    fields: ['userId'],
                    type: 'foreign key',
                    references: {
                        table: 'Users',
                        field: 'id'
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                    transaction: transaction
                })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.removeColumn('RendezVousUserAttendances', 'rendezVousId', { transaction: transaction }),
                queryInterface.removeColumn('RendezVousUserAttendances', 'userId', { transaction: transaction })
            ])
        }
    )
};
