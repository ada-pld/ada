import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable('Sessions', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        allowNull: false,
                        autoIncrement: true
                    },
                    userId: {
                        type: DataTypes.UUID
                    },
                    accessToken: {
                        type: DataTypes.CHAR(64),
                        unique: true,
                        allowNull: false
                    },
                    refreshToken: {
                        type: DataTypes.CHAR(64),
                        unique: true,
                        allowNull: false
                    },
                    accessTokenExpires: {
                        type: DataTypes.BIGINT,
                        allowNull: false
                    },
                    refreshTokenExpires: {
                        type: DataTypes.BIGINT,
                        allowNull: false
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
                queryInterface.dropTable('Sessions', { transaction: transaction }),
            ])
        }
    )
};
