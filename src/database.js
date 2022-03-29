const mariadb = require('mariadb');

const pool = mariadb.createPool({
        host: 'localhost', //'mydb.com', 
        user: 'root', //'myUser', 
        password: '', //'myPassword',
        database: 'syspzv3bd'
    })//,connectTimeout: 5


module.exports = {
    pool
}