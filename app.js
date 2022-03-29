const express = require('express');
const app = express();
const routes = require('./rotas')
const cors = require('cors')

app.use(express.json())
app.use(cors())
app.use(routes)

const ip = require('ip').address('public')
const protocol = process.env.PROTOCOL || 'http'
const port = process.env.PORT || '8081'

app.listen(port, () => {
    console.log(`servidor ON em http://localhost:${port} ou ${protocol}://${ip}:${port}`)
})