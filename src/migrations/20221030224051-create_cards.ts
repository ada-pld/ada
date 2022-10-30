import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable('Cards', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        allowNull: false,
                        autoIncrement: true
                    },
                    version: {
                        type: DataTypes.INTEGER,
                        defaultValue: 1
                    },
                    idInSprint: {
                        type: DataTypes.INTEGER,
                        defaultValue: -1
                    },
                    name: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    asWho: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    task: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    description: {
                        type: DataTypes.TEXT,
                        allowNull: false
                    },
                    workingDays: {
                        type: DataTypes.INTEGER,
                        defaultValue: 0
                    },
                    status: {
                        type: DataTypes.ENUM("REJECTED", "WAITING_APPROVAL", "NOT_STARTED", "STARTED", "FINISHED"),
                        defaultValue: "WAITING_APPROVAL"
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
                queryInterface.dropTable('Cards', { transaction: transaction })
            ])
        }
    )
};
