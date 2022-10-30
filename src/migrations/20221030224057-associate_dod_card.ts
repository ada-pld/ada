import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addColumn('DoDs', 'cardId', {
                    type: DataTypes.INTEGER,
                    references: {
                        model: 'Cards',
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
                queryInterface.removeColumn('DoDs', 'cardId', { transaction: transaction })
            ])
        }
    )
};
