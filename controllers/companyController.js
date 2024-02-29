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

const validateYtunnus = (ytunnus) => {
    let regex = /^[0-9]{7}-[0-9]{1}$/;
    return regex.test(ytunnus);
}
// Y-tunnus validation methods end here


// Validate company data
function checkCompanyDataEntriesExists(company) {
    // Check if values are present
    let fieldsNotValid = [];
    if (!company.nimi || !company.y_tunnus || !company.osoite || !company.toimiala_id) {
        (!company.nimi) ? fieldsNotValid.push('nimi') : null;
        (!company.osoite) ? fieldsNotValid.push('osoite') : null;
        (!company.y_tunnus) ? fieldsNotValid.push('y_tunnus') : null;
        (!company.toimiala_id) ? fieldsNotValid.push('toimiala_id') : null;
    }

    // Check if values are formatted correctly
    (!validateYtunnus(company.y_tunnus)) ? fieldsNotValid.push('Virheellinen Y-tunnus') : null;
    (company.toimiala_id < 1 || company.toimiala_id > 6) ? fieldsNotValid.push('Virheellinen toimiala') : null;

    return (fieldsNotValid.length > 0) ? [false, `Seuraavissa kentissä oli virheelliset arvot: ${fieldsNotValid.join(",")}`] : [true, null];
}

// Validate order data
function checkOrderDataEntriesExists(order) {
    // Check if values are present

    let fieldsNotFound = [];
    let fieldsNotValid = [];

    // Loop through multiple orders
    for (let i = 0; i < order.length; i++) {
        const singleOrder = order[i];

        (!singleOrder.veroton_hinta) ? fieldsNotFound.push(`veroton_hinta`) : null;
        (!singleOrder.toimituspvm) ? fieldsNotFound.push(`toimituspvm`) : null;
        (!singleOrder.vero_prosentti) ? fieldsNotFound.push(`vero_prosentti`) : null;

        // Check if values are formatted correctly
        (singleOrder.veroton_hinta < 0 || typeof singleOrder.veroton_hinta !== 'number') ? fieldsNotValid.push(`Virheellinen veroton hinta`) : null;
        (singleOrder.vero_prosentti < 0 || typeof singleOrder.vero_prosentti !== 'number') ? fieldsNotValid.push(`Virheellinen veroprosentti`) : null;
        (!isValidDateFormat(singleOrder.toimituspvm)) ? fieldsNotValid.push(`Virheellinen toimituspvm`) : null;
    }

    if (fieldsNotFound.length > 0) {
        return [false, `Seuraavissa kentissä oli virheelliset arvot: ${fieldsNotFound.join(",")}`];
    } else if (fieldsNotValid.length > 0) {
        return [false, `Seuraavissa kentissä oli virheelliset arvot: ${fieldsNotValid.join(",")}`];
    } else {
        return [true, null];
    }
}

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
            let all = req.query.all;
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
            let id = req.params.id;
            let param = req.params.param || '0';

            if (param === '1') {
                await sql.deleteCompanyAndOrders(id);
                res.status(200).json({ message: 'Yritys ja tilaukset poistettu tietokannasta onnistuneesti.' });
            } else {
                await sql.deleteCompany(id);
                res.status(200).json({ message: 'Yritys muutettu inaktiiviseksi tietokannassa.' });
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
            const [companyBool, companyError] = checkCompanyDataEntriesExists(yritys);
            const [orderBool, orderError] = checkOrderDataEntriesExists(tilaus);

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
    }

}


