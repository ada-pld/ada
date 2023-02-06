import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.createTable('RendezVouss', {
                    id: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        allowNull: false,
                        autoIncrement: true
                    },
                    date: {
                        type: DataTypes.DATE,
                        allowNull: false
                    },
                    agenda: {
                        type: DataTypes.TEXT
                    },
                    report: {
                        type: DataTypes.TEXT
                    },
                    sheduling: {
                        type: DataTypes.ENUM("PLANNED", "PASSED")
                    }
                }, { transaction: transaction })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.dropTable('RendezVouss', { transaction: transaction }),
            ])
        }
    )
};
