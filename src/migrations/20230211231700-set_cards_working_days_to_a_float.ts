import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.changeColumn('Cards', 'workingDays', {
                    type: DataTypes.FLOAT
                })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.changeColumn('Cards', 'workingDays', {
                    type: DataTypes.INTEGER
                })
            ])
        }
    )
};
