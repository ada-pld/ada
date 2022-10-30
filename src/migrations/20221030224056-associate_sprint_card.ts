import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addColumn('Cards', 'sprintId', {
                    type: DataTypes.INTEGER,
                    references: {
                        model: 'Sprints',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.removeColumn('Cards', 'sprintId', { transaction: transaction })
            ])
        }
    )
};
