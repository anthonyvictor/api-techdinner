const e = require('express')
const db = require('../database')
const { base64ToBlob } = require('../util/format')
const { getImageUrl } = require('../util/misc')

module.exports = {
    bebidas: [],

    getAll(req, res) {
        res.send(this.bebidas)
    },

    async _getAll(min) {
        const minId = min ? `where bebida_id > ${min} ` : ''
        const pool = await db.pool
        let conn
        let result = []
        try {
            conn = await pool.getConnection()
            const rows = await conn.query('SELECT * from tbl_cad_bb ' + minId + 'limit 10')

            async function getImage(clienteId) {
                // const filename = `src/images/bebidas/${e.bebida_id}.png`
                // if(fs.existsSync(filename)){
                //     return path.resolve(filename)
                //     // image = await new Promise((resolve, reject) => fs.readFile(`src/images/clientes/${clienteId}.png`, (err, data) => {
                //     //     if(err){
                //     //         reject(null)
                //     //     }
                //     //     if(data){
                //     //         resolve(data)
                //     //     }
                //     // }))
                // }else{
                //     return null
                // }
            }

            result = rows.map(e => {
                const imagem = getImageUrl({ type: 'bebidas', id: e.bebida_id })
                return {
                    id: e.bebida_id,
                    nome: e.bebida_desc,
                    imagem,
                    tipo: e.bebida_tipo,
                    sabor: e.bebida_sabor,
                    tamanho: e.bebida_tam,
                    valor: e.bebida_valor,
                    ativo: e.bebida_ativa,
                    visivel: e.bebida_visivel,
                    vendidos: e.bebida_qtd,
                }
            })
            if (min) {
                this.bebidas = [...this.bebidas, ...result]
            } else {
                this.bebidas = result
            }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            if (result.length > 0) {
                let max = result.map(e => e.id).reduce((max, val) => (max > val ? max : val))
                this._getAll(max)
            }
        }
    },

    async save(req, res) {
        let conn
        try {
            const bebida = req.body.bebida
            const tipoPost = req.body.tipoPost //ativo, qtd, undefined
            let id = bebida.id

            conn = await db.pool.getConnection()
            let data = [
                bebida.tipo || null,
                bebida.nome || null,
                bebida.sabor || null,
                bebida.tamanho || null,
                bebida.valor || 0,
                base64ToBlob(bebida.imagem),
                bebida.qtd,
                bebida.ativo,
                bebida.visivel,
            ]

            let table = 'tbl_cad_bb',
                index = 'bebida_id',
                columns = `bebida_tipo, bebida_desc, bebida_sabor,  
                bebida_tam, bebida_valor, bebida_img, 
                bebida_qtd, bebida_ativa, bebida_visivel`

            if (tipoPost === 'ativo') {
                data = [bebida.ativo]
                columns = `bebida_ativa`
            } else if (tipoPost === 'qtd') {
                data = [bebida.qtd]
                columns = `bebida_qtd`
            }

            const cols = q =>
                columns
                    .replace(' ', '')
                    .split(',')
                    .map(e => (q ? `${e}=?` : e))
                    .join(', ')
            const questions = () => new Array(cols().split(', ').length).fill('?').join(',')

            const str = id
                ? `UPDATE ${table} SET ${cols(true)} WHERE ${index} = ${id}`
                : `INSERT INTO ${table} (${cols()}) VALUES (${questions()})`

            const e = await conn.query(str, data)
            if (e) {
                id = e.insertId > 0 ? e.insertId : id

                const newArray = this.bebidas.filter(e => e.id !== id)
                const oldItem = this.bebidas.find(e => Number(e.id) === Number(id))
                const newItem =
                    tipoPost === 'ativo'
                        ? { ...oldItem, ativo: bebida.ativo }
                        : tipoPost === 'qtd'
                        ? { ...oldItem, qtd: bebida.qtd }
                        : { ...bebida, id: id }

                if (e.affectedRows > 0) {
                    this.bebidas = [...newArray, newItem]
                }

                res.send({ ...bebida, id: id })
            } else {
                throw new Error(e)
            }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) return conn.end()
        }
    },
}
