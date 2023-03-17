import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addColumn('RendezVouss', 'rendezVousGroupId', {
                    type: DataTypes.INTEGER
                }),
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
