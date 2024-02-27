const bodyParser = require('body-parser');
const express = require('express');
const app = express();

app.use(express.json());

let port = 3004;
let hostname = '127.0.0.1';

const companyRoutes = require('./routes/companyRoutes');
app.use(companyRoutes);


app.listen(port, hostname, () => {
    console.log('Server is running at http://' + hostname + ':' + port + '/');
});



