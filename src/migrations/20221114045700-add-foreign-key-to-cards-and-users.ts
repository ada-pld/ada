import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addConstraint('CardUsers', {
                    fields: ['cardId'],
                    type: 'foreign key',
                    references: {
                        table: 'Cards',
                        field: 'id'
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE"
                }),
                queryInterface.addConstraint('CardUsers', {
                    fields: ['userId'],
                    type: 'foreign key',
                    references: {
                        table: 'Users',
                        field: 'id'
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE"
                })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            console.error("You can't go further beyond in the past migrations\nThis would cause data loss");
            transaction.rollback();
        }
    )
};
