import { QueryInterface, DataTypes, QueryTypes, Sequelize } from 'sequelize';

module.exports = {
    up: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            const result :any = (await queryInterface.sequelize.query(`
                SELECT
                    Cards.id AS cardId,
                    DoDs.name AS dodsName
                FROM DoDs
                INNER JOIN Cards ON DoDs.cardId = Cards.id
            `))[0];
            let arr = [];
            for (const r of result) {
                let dod = "";
                if (r.cardId in arr) {
                    dod = arr[r.cardId].dods + r.dodsName + "\n";
                } else {
                    dod = r.dodsName
                }
                arr[r.cardId] = {
                    cardId: r.cardId,
                    dods: dod
                }
            }
            arr = arr.filter(x => x != undefined);
            for (const r of arr)
                r.dods = r.dods.slice(0, -1);
            await queryInterface.addColumn("Cards", "dods", {
                type: DataTypes.TEXT,
                allowNull: false,
                defaultValue: " "
            });
            for (const r of arr) {
                await queryInterface.sequelize.query(`
                    UPDATE Cards
                    SET dods = :dods
                    WHERE id = :cardId
                `, {
                    replacements: r
                });
            }
            await queryInterface.dropTable("DoDs");
            return Promise.resolve();
        }
    ),

    down: (queryInterface: QueryInterface): Promise<any> => queryInterface.sequelize.transaction(
        async (transaction) => {
            console.log("You can't go further beyond in the past migrations\nThis would cause data loss");
            transaction.rollback();
        }
    )
};
