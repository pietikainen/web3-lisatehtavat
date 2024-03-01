const sql = require('../database/companyDatabase');

// Y-tunnus validation methods start here
// To accept user input in the form of '1234567-8' or '12345678'
function formatYtunnus(ytunnus) {
    if (validateYtunnus(ytunnus)) {
        return ytunnus;
    } else {
        const cleanedInput = ytunnus.replace('-', '');
        const cleanerInput = cleanedInput.slice(0, 7) + '-' + cleanedInput.slice(7);

        if (validateYtunnus(cleanerInput)) {
            return cleanerInput;
        } else {
            return false;
        }
    }
}
// Validate y-tunnus format. 7 digits, hyphen and a single digit
const validateYtunnus = (ytunnus) => {
    let regex = /^[0-9]{7}-[0-9]{1}$/;
    return regex.test(ytunnus);
}
// Y-tunnus validation methods end here


// Validate company data and return boolean and error message
async function checkCompanyDataEntriesExists(company) {
    let fieldsNotValid = [];

    (!company.nimi) ? fieldsNotValid.push('nimi') : null;
    (!company.osoite) ? fieldsNotValid.push('osoite') : null;
    if (!company.y_tunnus || !validateYtunnus(company.y_tunnus)) {
        fieldsNotValid.push('y_tunnus');
    }
    if (!company.toimiala_id || !await sql.compareToExistingBusinessAreas(company.toimiala_id)) {
        fieldsNotValid.push('toimiala_id');
    }

    return (fieldsNotValid.length > 0) ? [false, `Seuraavissa kentissä oli väärät arvot: ${fieldsNotValid.join(",")}`] : [true, null];
}

// Validate order data and return boolean and error message
async function checkOrderDataEntriesExists(order) {
    let fieldsNotValid = [];

    // Loop through multiple orders
    for (let i = 0; i < order.length; i++) {
        const singleOrder = order[i];

        (!singleOrder.veroton_hinta || singleOrder.veroton_hinta < 0) ? fieldsNotValid.push(`veroton_hinta`) : null;
        (!singleOrder.toimituspvm || !isValidDateFormat(singleOrder.toimituspvm)) ? fieldsNotValid.push(`toimituspvm`) : null;
        (!singleOrder.vero_prosentti || singleOrder.vero_prosentti < 0) ? fieldsNotValid.push(`vero_prosentti`) : null;
    }

    return (fieldsNotValid.length > 0) ? [false, `Seuraavissa kentissä oli väärät arvot: ${fieldsNotValid.join(",")}`] : [true, null];
}

// Check if date is in valid format
function isValidDateFormat(date) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
}

module.exports = {

    /* GET: /api/company
        All companies with given parameters ('nimi', 'y-tunnus', 'toimiala')
        Or all companies if no parameters are given
    */
    getCompany: async (req, res) => {
        try {
            (req.query.y_tunnus) ? req.query.y_tunnus = formatYtunnus(req.query.y_tunnus) : null;
            let c = await sql.getCompany(req.query);
            res.status(200).json(c);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /* DELETE: /api/company/:id/:param
        param = 1: completely delete company and it's orders
        param = 0: set the company as inactive in DB => yritys.status = 1
        if no parameter is given, treats it as param = 0.
    */
    deleteCompany: async (req, res) => {
        try {
            const id = req.params.id;
            let param = (req.params.param) ? Number(req.params.param) : 0;

            if (param === 1) {
                await sql.deleteCompanyAndOrders(id);
                res.status(200).json({ message: 'Yritys ja tilaukset poistettu (forced) tietokannasta onnistuneesti.' });
            } else {
                const ordersQuery = await sql.getAmountOfOrdersByCompany(id);
                if (ordersQuery > 0) {
                    return res.status(400).json({ error: 'Yrityksellä on tilauksia, joten sitä ei voida inaktivoida.' });
                }
                await sql.deleteCompany(id);
                res.status(200).json({ message: 'Yritys muutettu inaktiiviseksi tietokannassa. (0 => 1)' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /* POST: /api/order

        Add company and it's orders to the database
        L7
    */
    addCompanyAndOrders: async (req, res) => {
        try {
            const { yritys, tilaus } = req.body;
            const [companyBool, companyError] = await checkCompanyDataEntriesExists(yritys);
            const [orderBool, orderError] = await checkOrderDataEntriesExists(tilaus);

            if (!companyBool) {
                return res.status(400).json({ error: companyError });
            }

            if (!orderBool) {
                return res.status(400).json({ error: orderError });
            }

            if (!yritys || !tilaus) {
                return res.status(400).json({ error: 'Yritys tai tilaus puuttuu.' });
            }

            await sql.addCompanyAndOrders(yritys, tilaus);

            res.status(200).json({ message: 'Yritys ja tilaukset lisätty tietokantaan.' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error', message: err.message });
        }
    },


    /* PUT: /api/order/:id
 
        Update order from company with given id
        L8 + L9 + L10
    */
    updateOrder: async (req, res) => {
        try {
            const id = req.params.id;
            const orders = req.body;
            const currentDate = new Date(Date.now());

            if (!id || !req.body) {
                return res.status(400).json({ error: 'Tilaus tai yrityksen id puuttuu.' });
            }

            ordersToPush = [];
            updatedOrderInfo = [];
            for (let order of orders) {
                const originalOrder = await sql.getOrder(order.tilausid);

                if (originalOrder[0].toimituspvm > currentDate) {
                    ordersToPush.push(order);
                    updatedOrderInfo.push({
                        tilausid: order.tilausid,
                        toimituspvm_original: originalOrder[0].toimituspvm,
                        toimituspvm_uusi: order.toimituspvm,

                    });
                } else {
                    console.log('Tilausta ei voida päivittää, koska tilaus on jo toimitettu.');
                }
            }
            
            if (ordersToPush.length === 0) {
                return res.status(400).json({ error: 'Kaikki tilaukset on jo toimitettu. Muutoksia ei voi tehdä.' });
            } else {
                for (let order of ordersToPush) {
                    await sql.updateOrder(id, order);
                }
                res.status(200).json({ updatedOrderInfo });
            }
            
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error', message: err.message });
        }
    }
}