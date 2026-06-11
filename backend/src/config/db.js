const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true // Allows connecting to local SQL Server instance without SSL errors
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server database:', config.database);
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed! Error: ', err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};
