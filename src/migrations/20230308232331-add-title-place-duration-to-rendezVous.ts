import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addColumn('RendezVouss', 'duration', {
                    type: DataTypes.STRING
                }),
                queryInterface.addColumn('RendezVouss', 'location', {
                    type: DataTypes.STRING
                }),
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.removeColumn('RendezVouss', 'duration'),
                queryInterface.removeColumn('RendezVouss', 'location'),
            ])
        }
    )
};
