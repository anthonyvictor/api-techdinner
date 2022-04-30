const express = require('express');
const app = express();
const cors = require('cors')
const db = require('./src/database');
const { getUrls } = require('./src/util/misc');

app.use(express.json())
app.use(cors())

async function testDbConnection(){
    const pool = await db.pool
    const conexao = pool?.getConnection
    if(!conexao) throw new Error('Conexão interna falhou.')
}

testDbConnection().then((k) => {
    const routes = require('./rotas')
    app.use(routes)    
}).catch(err => {
    app.get('/*', (req, res) => {
        // res.send(`${err} ${err.stack}`)
        console.error(err, err.stack)
        res.send(`Falha no servidor!`)
    })
}).finally(() => {    
    const {localUrl, staticUrl, port} = getUrls()
    app.listen(port, () => {
        console.log(`servidor ON em ${localUrl} ou ${staticUrl}`)
    })
})
