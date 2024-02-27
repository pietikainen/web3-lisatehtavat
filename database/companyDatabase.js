const mysql = require('mysql');

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
    })
}

// Y-tunnus validation methods start here
// To accept user input in the form of '1234567-8' or '12345678'
function formatYtunnus(ytunnus) {
    if (validateYtunnus(ytunnus)) {
        return ytunnus;
    } else {
        const cleanedInput = ytunnus.replace('-', '');
        return cleanedInput.slice(0, 7) + '-' + cleanedInput.slice(7);
    }
}

const validateYtunnus = (ytunnus) => {
    let regex = /^[0-9]{7}-[0-9]{1}$/;
    return regex.test(ytunnus);
}
// Y-tunnus validation methods end here



module.exports = {

    /* GET: /api/company
    * All companies with given parameters ('nimi', 'y-tunnus', 'toimiala')
      Or all companies if no parameters are given
      Included are the following:
      -  Y-tunnus validation (formatYtunnus, validateYtunnus).
            - User can input either form of the Y-tunnus (1234567-8 or 12345678)
      -  the count of orders, the sum of untaxed prices and the sum of taxed prices
    Tasks L1-L3.
    */
    getCompany: ({nimi, y_tunnus, toimiala}) => {
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
            tilaus ON y.id = tilaus.yritys_id
        `;

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
    */
    deleteCompany: (id) => {
        let query = `
        UPDATE yritys
        SET status = 1
        WHERE id = ?
        AND id NOT IN (SELECT yritys_id FROM TILAUS WHERE yritys_id = ?);
        `

        console.log('query: ' + query);
        return executeSQL(query, [id, id])

    }


}