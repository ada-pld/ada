import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.changeColumn('RendezVousGroups', 'groupColor', {
                    type: DataTypes.STRING,
                    allowNull: false
                })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.changeColumn('RendezVousGroups', 'groupColor', {
                    type: DataTypes.INTEGER,
                    allowNull: false
                })
            ])
        }
    )
};