const router = require('express').Router()
const clientesController = require('../controllers/clientesController')

router.get('/', (req, res) => clientesController.getAll(req, res))
router.get('/imagens', (req, res) => clientesController.getImages(req, res))
router.post('/salvar', (req, res) => clientesController.save(req, res))
router.delete('/excluir', (req, res) => clientesController.delete(req, res))
router.get('/pagamento/costumeultimo', (req,res) => clientesController.getCostumeUltimoPagamento(req, res))
router.get('/pagamento/ultimos', (req,res) => clientesController.getUltimosPagamentos(req, res))

module.exports = router
