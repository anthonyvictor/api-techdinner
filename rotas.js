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

router.post('/', cors(), (req, res) => res.json({ success: true }))
router.get('/clientes', clientesController.getAll)
router.get('/clientes/imagens', clientesController.getImages)
router.post('/clientes/salvar', clientesController.save)
router.delete('/clientes/excluir', clientesController.delete)
router.get('/clientes/pagamento/costumeultimo', clientesController.getCostumeUltimoPagamento)
router.get('/clientes/pagamento/ultimos', clientesController.getUltimosPagamentos)

router.get('/enderecos', enderecosController.getAll)
router.get('/taxa', enderecosController.getTaxaOriginal)

router.get('/pizzas', pizzasController.getAll)
router.post('/pizzas/salvar/sabor', pizzasController.saveSabor)

router.get('/bebidas', bebidasController.getAll)
router.post('/bebidas/salvar', bebidasController.save)

router.get('/outros', outrosController.getAll)
router.post('/outros/salvar', outrosController.save)

router.get('/pedidos', pedidosController.getAndamento)
router.post('/pedidos/novo', pedidosController.novoPedido)
router.post('/pedidos/checkupdates', pedidosController.checkUpdate)
router.post('/pedidos/update/cliente', pedidosController.updateCliente)
router.post('/pedidos/update/tipo', pedidosController.updateTipo)
router.post('/pedidos/update/endereco', pedidosController.updateEndereco)
router.post('/pedidos/update/aplicativo', pedidosController.updateAplicativo)
router.post('/pedidos/update/taxa', pedidosController.updateTaxa)
router.post('/pedidos/update/entregador', pedidosController.updateEntregador)
router.post('/pedidos/update/item', pedidosController.updateItem)
router.post('/pedidos/update/item/copy', pedidosController.copyItem)
router.delete('/pedidos/update/item/delete', pedidosController.deleteItem)
router.post('/pedidos/update/pagamento', pedidosController.updatePagamento)
router.post('/pedidos/duplicar', pedidosController.duplicar)
router.post('/pedidos/arquivar', pedidosController.arquivar)
router.post('/pedidos/desarquivar', pedidosController.desarquivar)
router.post('/pedidos/update/observacoes', pedidosController.updateObservacoes)
router.put('/pedidos/cancelar', pedidosController.cancelar)
router.put('/pedidos/finalizar', pedidosController.finalizar)
router.get('/relatorios', pedidosController.getRelatorios)

router.get('/entregadores/padrao', entregadoresController.getPadrao)
router.get('/entregadores', entregadoresController.getAll)

router.get('/auth', authController.auth) 

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
