const router = require('express').Router()
const relatoriosController = require('../controllers/relatoriosController')


router.get('/', (req,res) => relatoriosController.getRelatorios(req, res))
router.patch('/retomar/:id', (req,res) => relatoriosController.retomar(req, res))

module.exports = router