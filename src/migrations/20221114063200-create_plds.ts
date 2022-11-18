import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable("PLDs", {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        allowNull: false,
                        autoIncrement: true
                    },
                    versionInSprint: {
                        type: DataTypes.INTEGER,
                        defaultValue: 0,
                        allowNull: false
                    },
                    path: {
                        type: DataTypes.STRING
                    },
                    downloadPath: {
                        type: DataTypes.STRING
                    },
                    changesToPLD: {
                        type: DataTypes.TEXT,
                        allowNull: true
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
                queryInterface.dropTable('PLDs', { transaction: transaction })
            ])
        }
    )
};
