const router = require('express').Router()
const pizzasController = require('../controllers/pizzasController')

router.get('/', (req, res) => pizzasController.getAll(req, res))
router.get('/sabores', (req, res) => pizzasController.getSabores(req, res))
router.get('/tamanhos', (req, res) => pizzasController.getTamanhos(req, res))
router.get('/ingredientes', (req, res) => pizzasController.getIngredientes(req, res))
router.get('/valores', (req, res) => pizzasController.getValores(req, res))
router.get('/bordas', (req, res) => pizzasController.getBordas(req, res))
router.post('/salvar/sabor', (req, res) => pizzasController.saveSabor(req, res))
router.post('/salvar/tamanho', (req, res) => pizzasController.saveTamanho(req, res))

module.exports = router