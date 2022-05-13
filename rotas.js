const router = require('express').Router()
let cors = require("cors")
const authController = require('./src/controllers/authController')
const bebidasController = require('./src/controllers/bebidasController')
const clientesController = require('./src/controllers/clientesController')
const enderecosController = require('./src/controllers/enderecosController')
const entregadoresController = require('./src/controllers/entregadoresController')
const outrosController = require('./src/controllers/outrosController')
const pedidosController = require('./src/controllers/pedidosController')
const pizzasController = require('./src/controllers/pizzasController')
const misc = require('./src/util/misc')

router.post('/', cors(), (req,res)=> res.json({ success: true }))

router.use('/clientes', require('./src/routes/clientesRoute'))

router.get('/enderecos', (req, res) => enderecosController.getAll(req, res))
router.get('/taxa', (req, res) => enderecosController.getTaxaOriginal(req, res))

router.use('/pizzas', require('./src/routes/pizzasRoute'))

router.get('/bebidas', (req, res) => bebidasController.getAll(req, res))
router.post('/bebidas/salvar', (req, res) => bebidasController.save(req, res))

router.get('/outros', (req, res) => outrosController.getAll(req, res))
router.post('/outros/salvar', (req, res) => outrosController.save(req, res))

router.use('/pedidos', require('./src/routes/pedidosRoute'))
router.use('/relatorios', require('./src/routes/relatoriosRoute'))

router.get('/entregadores/padrao', (req,res) => entregadoresController.getPadrao(req, res))
router.get('/entregadores', (req,res) => entregadoresController.getAll(req, res))

router.get('/auth', (req, res) => authController.auth(req, res)) 

const express = require('express')
router.use('/static', express.static(__dirname + '/src/images'));


clientesController._getAll()
enderecosController._getAll()
pizzasController._getAll()
bebidasController._getAll()
outrosController._getAll()
authController._getAll()
pedidosController.refreshAndamento()

module.exports = router
