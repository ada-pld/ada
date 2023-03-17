import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addConstraint('Sessions', {
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
                queryInterface.removeColumn('Sessions', 'userId', { transaction: transaction })
            ])
        }
    )
};
