const db = require('../database')
const { base64ToBlob } = require('../util/format')
const { getImageUrl } = require('../util/misc')

module.exports = {
    outros: [],

    getAll(req, res){res.send(this.outros)},

    async _getAll(min) {
        const minId = min 
        ? `where outro_id > ${min} ` : '' 
        const pool = await db.pool
        let conn;
        let result = []
        try {
          conn = await pool.getConnection();
        const rows = await conn.query(
            'SELECT * from tbl_cad_outros '
            + minId
            + 'limit 10'
        );
        result = rows.map(e=> {
            const imagem = getImageUrl({ type: 'outros', id: e.outro_id })
            return {
            id: e.outro_id,
            nome: e.outro_desc,
            imagem,
            valor: e.outro_valor,
            ativo: e.outro_ativo,
            visivel: e.outro_visivel,
            vendidos: e.outro_qtd
        }})
        if(min){
            this.outros = [...this.outros, ...result]
        }else{
            this.outros = result
        }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            if(result.length > 0){
                let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
                this._getAll(max)
            }
        }
    },

    async save(req, res){
        let conn;
        try {
            const outro = req.body.outro
            const tipoPost = req.body.tipoPost //ativo, qtd, undefined
            let id = outro.id
            
            conn = await db.pool.getConnection();
            let data = [
                (outro.nome || null),
                (outro.valor || 0),
                (base64ToBlob(outro.imagem)),
                (outro.qtd),
                (outro.ativo),
                (outro.visivel)
            ]

            let table = 'tbl_cad_outros',

                index = 'outro_id',

                columns = `outro_desc, outro_valor, 
                outro_qtd, outro_ativo, outro_visivel`

            if(tipoPost === 'ativo'){
                data = [outro.ativo]
                columns = `outro_ativo`
            }else if(tipoPost === 'qtd'){
                data = [outro.qtd]
                columns = `outro_qtd`
            }

            const cols = (q) => columns.replace(' ', '').split(',').map(e => q ? `${e}=?` : e).join(', ')
            const questions = () => new Array(cols().split(', ').length).fill('?').join(',')

            const str = id
            ? `UPDATE ${table} SET ${cols(true)} WHERE ${index} = ${id}`
            : `INSERT INTO ${table} (${cols()}) VALUES (${questions()})`

            const e = await conn.query(str, data)
            if(e) {
                id = e.insertId > 0 ? e.insertId : id

                const newArray = this.outros.filter(e => e.id !== id)
                const oldItem = this.outros.find(e => Number(e.id) === Number(id))
                const newItem = 
                tipoPost === 'ativo' ? {...oldItem, ativo: outro.ativo}
                : tipoPost === 'qtd' ? {...oldItem, qtd: outro.qtd}
                : {...outro, id: id}
                

                if(e.affectedRows > 0){
                    this.outros = [...newArray, newItem]
                }


                res.send({...outro, id})
            }else{
                throw new Error(e)
            }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) return conn.end();
        }
    }
}