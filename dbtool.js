const mysql = require('mysql2/promise');

const exportsObj = {
    pool: null
}

const connect = async function () {
    // Create the connection pool. The pool-specific settings are the defaults
    const pool = mysql.createPool({
        host: process.env.DB_HOST, // server: URL or IP address
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
        idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    });
    exportsObj.pool = pool
    return pool
}

exportsObj.connect = connect

module.exports = exportsObj
