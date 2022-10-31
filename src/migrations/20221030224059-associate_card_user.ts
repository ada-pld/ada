import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable('CardUsers', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        allowNull: false,
                        autoIncrement: true
                    },
                    userId: {
                        type: DataTypes.UUID,
                        primaryKey: true
                    },
                    cardId: {
                        type: DataTypes.INTEGER,
                        primaryKey: true
                    },
                    createdAt: {
                        type: DataTypes.DATE,
                        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
                    },
                    updatedAt: {
                        type: DataTypes.DATE,
                        defaultValue: Sequelize.fn("NOW")
                    }
                })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.dropTable('CardUsers', { transaction: transaction })
            ])
        }
    )
};
