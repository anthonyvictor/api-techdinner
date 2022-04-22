const mariadb = require('mariadb');
require('dotenv/config')

const dbParams = {
    host: process.env.HOST || null, //'mydb.com', 
    user: process.env.USER || null, //'myUser', 
    password: process.env.PASSWORD || '', //'myPassword',
    database: process.env.DATABASE || null,
    connectTimeout: process.env.CONNECTTIMEOUT || null
}


async function getPool(){
    try{
        const res = (!dbParams.host || !dbParams.user || !dbParams.database ? null : mariadb.createPool(dbParams))
        await res.getConnection()
        return res
    }catch{
        console.error('Falha ao conectar ao banco de dados!')
        return null
    }
}

module.exports = {
    pool: getPool()
}