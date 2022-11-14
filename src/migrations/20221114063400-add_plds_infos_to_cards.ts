import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.addColumn("Cards", "lastPLDEdit", {
                    type: DataTypes.INTEGER,
                    defaultValue: 0,
                    allowNull: false
                }),
                queryInterface.addColumn("Cards", "actPLD", {
                    type: DataTypes.INTEGER,
                    defaultValue: 0,
                    allowNull: false
                }),
                queryInterface.addColumn("Cards", "lastPLDStatus", {
                    type: DataTypes.ENUM("REJECTED", "WAITING_APPROVAL", "NOT_STARTED", "STARTED", "FINISHED"),
                    defaultValue: "WAITING_APPROVAL"
                })
            ])
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            return Promise.all([
                queryInterface.removeColumn('Cards', 'lastPLDEdit'),
                queryInterface.removeColumn('Cards', 'actPLD'),
                queryInterface.removeColumn('Cards', 'lastPLDStatus')
            ])
        }
    )
};
