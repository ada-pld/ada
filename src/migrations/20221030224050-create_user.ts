import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable('Users', {
                    id: {
                        type: DataTypes.UUID,
                        defaultValue: DataTypes.UUIDV4,
                        primaryKey: true,
                        allowNull: false,
                    },
                    firstname: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    lastname: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    email: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    password: {
                        type: DataTypes.STRING,
                        allowNull: false
                    },
                    role: {
                        type: DataTypes.ENUM("ADMIN", "EDITOR", "MAINTENER", "USER"),
                        defaultValue: "USER"
                    },
                    isDefaultPassword: {
                        type: DataTypes.BOOLEAN,
                        defaultValue: true
                    },
                    description: {
                        type: DataTypes.TEXT,
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
                queryInterface.dropTable('Users', { transaction: transaction })
            ])
        }
    )
};
