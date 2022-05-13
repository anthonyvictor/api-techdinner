const router = require('express').Router()
const pedidosController = require('../controllers/pedidosController')

router.get('/', (req,res) => pedidosController.getAndamento(req, res))
router.post('/novo', (req,res) => pedidosController.novoPedido(req, res))
router.post('/checkupdates', (req,res) => pedidosController.checkUpdate(req, res))
router.post('/update/cliente', (req,res) => pedidosController.updateCliente(req, res))
router.post('/update/tipo', (req,res) => pedidosController.updateTipo(req, res))
router.post('/update/endereco', (req,res) => pedidosController.updateEndereco(req, res))
router.post('/update/aplicativo', (req,res) => pedidosController.updateAplicativo(req, res))
router.post('/update/taxa', (req,res) => pedidosController.updateTaxa(req, res))
router.post('/update/entregador', (req,res) => pedidosController.updateEntregador(req, res))
router.post('/update/item', (req,res) => pedidosController.updateItem(req, res))
router.post('/update/item/copy', (req,res) => pedidosController.copyItem(req, res))
router.delete('/update/item/delete', (req,res) => pedidosController.deleteItem(req, res))
router.post('/update/pagamento', (req,res) => pedidosController.updatePagamento(req, res))
router.post('/update/impressoes', (req,res) => pedidosController.updateImpressoes(req, res))
router.post('/duplicar', (req,res) => pedidosController.duplicar(req, res))
router.post('/arquivar', (req,res) => pedidosController.arquivar(req, res))
router.post('/desarquivar', (req,res) => pedidosController.desarquivar(req, res))
router.post('/update/observacoes', (req,res) => pedidosController.updateObservacoes(req, res))
router.put('/cancelar', (req,res) => pedidosController.cancelar(req, res))
router.put('/finalizar', (req,res) => pedidosController.finalizar(req, res))


function deleteArquivadosError(){
    clearInterval(deleteArquivadosInterval)
}
const deleteArquivadosInterval = setInterval(() => {
        pedidosController.deleteArquivados(deleteArquivadosError)    
    }, 5 * 1000)

module.exports = router