import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable('RendezVousGroups', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        allowNull: false,
                        autoIncrement: true
                    },
                    groupName: {
                        type: DataTypes.STRING,
                        allowNull: false,
                    },
                    groupColor: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    typicalDuration: {
                        type: DataTypes.INTEGER,
                        allowNull: false,
                    },
                    typicalLocation: {
                        type: DataTypes.STRING,
                        allowNull: false,
                    },
                    PLDMustBeGenerated: {
                        type: DataTypes.BOOLEAN,
                        defaultValue: false,
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
                queryInterface.dropTable('RendezVousGroups', { transaction: transaction }),
            ])
        }
    )
};
