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
router.get('/clientes', (req, res) => clientesController.getAll(req, res))
router.get('/clientes/imagens', (req, res) => clientesController.getImages(req, res))
router.post('/clientes/salvar', (req, res) => clientesController.save(req, res))
router.delete('/clientes/excluir', (req, res) => clientesController.delete(req, res))
router.get('/clientes/pagamento/costumeultimo', (req,res) => clientesController.getCostumeUltimoPagamento(req, res))
router.get('/clientes/pagamento/ultimos', (req,res) => clientesController.getUltimosPagamentos(req, res))

router.get('/enderecos', (req, res) => enderecosController.getAll(req, res))
router.get('/taxa', (req, res) => enderecosController.getTaxaOriginal(req, res))

router.get('/pizzas', (req, res) => pizzasController.getAll(req, res))
router.post('/pizzas/salvar/sabor', (req, res) => pizzasController.saveSabor(req, res))

router.get('/bebidas', (req, res) => bebidasController.getAll(req, res))
router.post('/bebidas/salvar', (req, res) => bebidasController.save(req, res))

router.get('/outros', (req, res) => outrosController.getAll(req, res))
router.post('/outros/salvar', (req, res) => outrosController.save(req, res))

router.get('/pedidos', (req,res) => pedidosController.getAndamento(req, res))
router.post('/pedidos/novo', (req,res) => pedidosController.novoPedido(req, res))
router.post('/pedidos/checkupdates', (req,res) => pedidosController.checkUpdate(req, res))
router.post('/pedidos/update/cliente', (req,res) => pedidosController.updateCliente(req, res))
router.post('/pedidos/update/tipo', (req,res) => pedidosController.updateTipo(req, res))
router.post('/pedidos/update/endereco', (req,res) => pedidosController.updateEndereco(req, res))
router.post('/pedidos/update/aplicativo', (req,res) => pedidosController.updateAplicativo(req, res))
router.post('/pedidos/update/taxa', (req,res) => pedidosController.updateTaxa(req, res))
router.post('/pedidos/update/entregador', (req,res) => pedidosController.updateEntregador(req, res))
router.post('/pedidos/update/item', (req,res) => pedidosController.updateItem(req, res))
router.post('/pedidos/update/item/copy', (req,res) => pedidosController.copyItem(req, res))
router.delete('/pedidos/update/item/delete', (req,res) => pedidosController.deleteItem(req, res))
router.post('/pedidos/update/pagamento', (req,res) => pedidosController.updatePagamento(req, res))
router.post('/pedidos/duplicar', (req,res) => pedidosController.duplicar(req, res))
router.post('/pedidos/arquivar', (req,res) => pedidosController.arquivar(req, res))
router.post('/pedidos/desarquivar', (req,res) => pedidosController.desarquivar(req, res))
router.post('/pedidos/update/observacoes', (req,res) => pedidosController.updateObservacoes(req, res))
router.put('/pedidos/cancelar', (req,res) => pedidosController.cancelar(req, res))
router.put('/pedidos/finalizar', (req,res) => pedidosController.finalizar(req, res))
router.get('/relatorios', (req,res) => pedidosController.getRelatorios(req, res))

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
