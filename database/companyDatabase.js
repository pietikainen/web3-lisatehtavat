const mysql = require('mysql');
const { formatYtunnus } = require('../controllers/companyController');

// Define connection parameters for MySQL
let connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'yritys'
});


// Execute SQL queries
const executeSQL = (query, params) => {
    return new Promise((resolve, reject) => {
        connection.query(query, params, function (error, results, fields) {
            error ? reject(error) : resolve(results);
        });
    });
}

module.exports = {

    /* GET: /api/company

      All companies with given parameters ('nimi', 'y-tunnus', 'toimiala')
      Or all companies if no parameters are given
      Included are the following:
      -  Y-tunnus validation (formatYtunnus, validateYtunnus).
            - User can input either form of the Y-tunnus (1234567-8 or 12345678)
      -  the count of orders, the sum of untaxed prices and the sum of taxed prices
    Tasks L1-L3.
    */

    getCompany: ({ nimi, y_tunnus, toimiala }) => {
        let query = `
        SELECT 
            y.id,
            y.nimi,
            y.y_tunnus,
            y.osoite,
            y.toimiala_id,
            t.selite AS toimiala_selite,
            COUNT(tilaus.id) AS tilaukset_lkm,
            SUM(tilaus.veroton_hinta) AS yht_veroton,
            SUM(tilaus.veroton_hinta * (1 + tilaus.vero_prosentti / 100)) AS yht_verollinen
        FROM
            yritys y
        LEFT JOIN 
            toimiala t ON y.toimiala_id = t.id
        LEFT JOIN 
            tilaus ON y.id = tilaus.yritys_id`;

        if (nimi || y_tunnus || toimiala) {
            query += ' WHERE';

            if (nimi) {
                query += ` nimi LIKE '${nimi}%'`;
            }

            if (y_tunnus) {
                query += ` y_tunnus = '${formatYtunnus(y_tunnus)}'`;
            }

            if (toimiala) {
                query += ` toimiala_id = '${toimiala}'`;
            }
        }
        query += ' GROUP BY y.id';

        console.log('query: ' + query);
        return executeSQL(query, null);
    },

    /*
    DELETE: /api/company/:id

    Remove the company from activelist => set in DB yritys.status = 1
    Does not update the status if the company has orders in DB.
    Task L5
    */

    deleteCompany: (id) => {
        let query = `
        UPDATE yritys
        SET status = 1
        WHERE id = ?
        AND id NOT IN (SELECT yritys_id FROM TILAUS WHERE yritys_id = ?);`;

        console.log('query: ' + query);
        return executeSQL(query, [id, id]);
    },

    /* DELETE /api/company/:id/:params

    Param = 1: Delete company from database with it's orders.
    Param = 0: Remove company from being active by updating status 0 => 1.
    Task L6
    */

    deleteCompanyAndOrders: async (id) => {
        try {
            await executeSQL('START TRANSACTION;');
            await executeSQL('DELETE FROM tilaus WHERE yritys_id = ?;', [id]);
            await executeSQL('DELETE FROM yritys WHERE id = ?;', [id]);
            await executeSQL('COMMIT;');
        } catch (err) {
            await executeSQL('ROLLBACK;');
            throw err;
        }             
    },

    /* POST: /api/order

    Add company and it's orders to the database.
    */

    addCompanyAndOrders: async (company, orders) => {
        try {
            await executeSQL('START TRANSACTION;');
            let result = await executeSQL('INSERT INTO yritys SET ?;', company);
            let yritys_id = result.insertId;
            for (let order of orders) {
                order.yritys_id = yritys_id;
                await executeSQL('INSERT INTO tilaus SET ?;', order);
            }
            await executeSQL('COMMIT;');
        } catch (err) {
            await executeSQL('ROLLBACK;');
            throw err;
        }
    }



}