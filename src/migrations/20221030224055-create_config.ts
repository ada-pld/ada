import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable('Configs', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        allowNull: false,
                        autoIncrement: true
                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    value: {
                        type: DataTypes.STRING,
                        defaultValue: null
                    },
                    createdAt: {
                        type: DataTypes.DATE,
                        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
                    },
                    updatedAt: {
                        type: DataTypes.DATE,
                        defaultValue: Sequelize.fn("NOW")
                    }
                }, { transaction: transaction })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.dropTable('Configs', { transaction: transaction })
            ])
        }
    )
};
