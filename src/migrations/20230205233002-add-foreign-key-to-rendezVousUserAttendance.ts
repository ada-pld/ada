import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addConstraint('RendezVouss', {
                    fields: ['rendezVousGroupId'],
                    type: 'foreign key',
                    references: {
                        table: 'RendezVousGroups',
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
                queryInterface.removeColumn('RendezVouss', 'rendezVousGroupId', { transaction: transaction }),
            ])
        }
    )
};
