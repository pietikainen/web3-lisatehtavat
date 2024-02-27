const sql = require('../database/companyDatabase');

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

    /* DELETE: /api/company/:id
        Set the company as inactive in DB => yritys.status = 1
    */
    deleteCompany: async (req, res) => {
        try {
            let id = req.params.id;
            let c = await sql.deleteCompany(id);
            res.status(200).json(c);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }


}


