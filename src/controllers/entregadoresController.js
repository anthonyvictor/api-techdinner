const db = require('../database')

module.exports = {
    async getAll(req,res){res.send(await this._getAll())},
    async _getAll(){
        const pool = db.pool
        let conn;
        let result = null
        try {
            conn = await pool.getConnection();
            const rows = await conn.query(
                "select "
                + "entreg_id, entreg_nome, "
                + "c.cli_id, cli_nome, entreg_ativo "
                + "from tbl_cad_entreg "
                + "inner join tbl_cad_cli as c using(cli_id) "
            );
      
                result = rows.map(e => {return{
                    id: e.entreg_id,
                    nome: e.entreg_nome,
                    cliente: {id: e.cli_id, nome: e.cli_nome},
                    ativo: e.entreg_ativo,
                }})
                
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            return result
        }
    },

    async _getPadrao(){
        const pool = db.pool
        let conn;
        let result = null
        try {
            conn = await pool.getConnection();
            const rows = await conn.query(
                "select entreg_id, entreg_nome "
                + "from tbl_cad_entreg_padrao as p "
                + "inner join tbl_cad_entreg as e "
                + "on e.entreg_id = p.padrao_hoje"
            );
            for(let e of rows){
                result = {
                id: e.entreg_id,
                nome: e.entreg_nome
            }
        }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            return result
        }
    },

    async getPadrao(req,res){
        res.send(await this._getPadrao())
    },
}