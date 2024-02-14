const express = require('express');
// const mysql2 = require('mysql2/promise');
const dotenv = require('dotenv');
const hbs = require('hbs');
const wax = require('wax-on');
const dbtool = require('./dbtool.js')

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));

// Set up Handlebars
app.set('view engine', 'hbs');

// Use Wax-On for additional Handlebars helpers
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

async function main() {
    // create a MySQL connection
    // await mysql2.createConnection({
    //     host: process.env.DB_HOST, // server: URL or IP address
    //     user: process.env.DB_USER,
    //     database: process.env.DB_DATABASE,
    //     password: process.env.DB_PASSWORD
    // });
    await dbtool.connect();
}
main();

app.listen(3000, () => {
    console.log("server has started");
});