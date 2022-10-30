import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable('Sprints', {
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
                    workDaysNeeded: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    active: {
                        type: DataTypes.BOOLEAN,
                        defaultValue: false
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
                queryInterface.dropTable('Sprints', { transaction: transaction })
            ])
        }
    )
};
