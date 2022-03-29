const db = require('../database')

module.exports = {
    tipos: [],
    ingredientes: [],
    sabores: [],
    tamanhos: [],
    valores: [],
    bordas: [],

    getAll(req, res){res.send({
        tipos: this.tipos,
        ingredientes: this.ingredientes,
        sabores: this.sabores,
        tamanhos: this.tamanhos,
        valores: this.valores,
        bordas: this.bordas
    })},


    async _getTipos(min) {
        const minId = min 
        ? `where tipo_id > ${min} ` : '' 
        const pool = db.pool
        let conn;
        let result = []
        try {
          conn = await pool.getConnection();
        const rows = await conn.query(
            'SELECT * from tbl_cad_pz_tipos '
            + minId
            + 'limit 50'
        );
        result = rows.map(e=> {return {
            id: e.tipo_id,
            nome: e.tipo_desc,
            cor: e.tipo_cor,
            numero: e.tipo_num
        }})
        if(min){
            this.tipos = [...this.tipos, ...result]
        }else{
            this.tipos = result
        }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            if(result.length > 0){
                let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
                this._getTipos(max)
            }
        }
    },
    async _getIngredientes(min, id=null) {
        
        let minId = min ? `where ingr_id > ${min} ` : '' 
        minId = id ? `where ingr_id = ${id} ` : minId
        const pool = db.pool
        let conn;
        let result = []
        try {
          conn = await pool.getConnection();
        const rows = await conn.query(
            'SELECT * from tbl_cad_pz_ingr '
            + minId
            + 'limit 50'
        );
        result = rows.map(e=> {return {
            id: e.ingr_id,
            nome: e.ingr_desc
        }})
        if(min){
            this.ingredientes = [...this.ingredientes, ...result]
        }else if(id){
            return result
        }else{
            this.ingredientes = result
        }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            if(!id && result.length > 0){
                let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
                this._getIngredientes(max)
            }
        }
    },
    async _getSabores(min) {
        const minId = min 
        ? `where sabor_id > ${min} ` : '' 
        const pool = db.pool
        let conn;
        let result = []
        try {
        conn = await pool.getConnection();
        const str = 'SELECT * from tbl_cad_pz_sabores ' + minId + 'order by sabor_id asc limit 50'
        const rows = await conn.query(str)
        result = rows.map(e=> {return {
            id: e.sabor_id,
            tipo: {id: e.tipo_id},
            nome: e.sabor_desc,
            numero: e.sabor_num,
            ativo: e.sabor_ativo,
            visivel: e.sabor_visivel,
            ingredientes: e.sabor_ingr.split(',').map(e => {return{id: e}})
        }})

        if(min){
            this.sabores = [...this.sabores, ...result]
        }else{
            this.sabores = result
        }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            if(result.length > 0){
                let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
                this._getSabores(max)
            }
        }
    },
    async _getTamanhos(min) {
        const minId = min 
        ? `where tam_id > ${min} ` : '' 
        const pool = db.pool
        let conn;
        let result = []
        try {
          conn = await pool.getConnection();
        const rows = await conn.query(
            'SELECT * from tbl_cad_pz_tam '
            + minId
            + 'limit 50'
        );
        result = rows.map(e=> {return {
            id: e.tam_id,
            nome: e.tam_desc,
            visivel: e.tam_visivel,
            ativo: e.tam_ativo
        }})
        if(min){
            this.tamanhos = [...this.tamanhos, ...result]
        }else{
            this.tamanhos = result
        }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            if(result.length > 0){
                let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
                this._getTamanhos(max)
            }
        }
    },
    async _getValores(min) {
        const minId = min 
        ? `where valor_id > ${min} ` : '' 
        const pool = db.pool
        let conn;
        let result = []
        try {
          conn = await pool.getConnection();
        const rows = await conn.query(
            'SELECT * from tbl_cad_pz_valores '
            + minId
            + 'limit 50'
        );
        result = rows.map(e=> {return {
            id: e.valor_id,
            tamanho: {id: e.tam_id},
            tipo: {id: e.tipo_id},
            valor: e.valor
        }})
        if(min){
            this.valores = [...this.valores, ...result]
        }else{
            this.valores = result
        }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            if(result.length > 0){
                let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
                this._getValores(max)
            }
        }
    },
    async _getBordas(min) {
        const minId = min 
        ? `where borda_id > ${min} ` : '' 
        const pool = db.pool
        let conn;
        let result = []
        try {
          conn = await pool.getConnection();
        const rows = await conn.query(
            'SELECT * from tbl_cad_pz_bordas '
            + minId
            + 'limit 50'
        );
        result = rows.map(e=> {return {
            id: e.borda_id,
            tamanho: {id: e.tam_id},
            valor: e.borda_valor
        }})
        if(min){
            this.bordas = [...this.bordas, ...result]
        }else{
            this.bordas = result
        }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            if(result.length > 0){
                let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
                this._getBordas(max)
            }
        }
    },

    async _getAll(){
        this._getTipos()
        this._getIngredientes()
        this._getSabores()
        this._getTamanhos()
        this._getValores()
        this._getBordas()
    },

    async saveSabor(req, res){
        const sabor = req.body.sabor
        let id = sabor.id
        const pool = db.pool
        let conn;
        try {
            conn = await pool.getConnection();

            let data = [
                (sabor.tipo.id || null),
                (sabor.nome || null),
                (sabor.ingredientes.map(i => i.id).join() || null),
                (sabor.ativo),
                (sabor.numero),
                (sabor.visivel)
            ]
            const str = id
            ? `UPDATE tbl_cad_pz_sabores set 
            tipo_id=?, sabor_desc=?, sabor_ingr=?, 
            sabor_ativo=?, sabor_num=?, sabor_visivel=? 
            where sabor_id = ${id}`

            : `INSERT INTO tbl_cad_pz_sabores 
            (tipo_id, sabor_desc, sabor_ingr, 
            sabor_ativo, sabor_num, sabor_visivel) 
            VALUES (?,?,?,?,?,?)`

            const e = await conn.query(str, data)
            if(e) {
                id = e.insertId > 0 ? e.insertId : id
                
                if(e.affectedRows > 0){
                    this.sabores = [
                        ...this.sabores.filter(e => e.id !== id),
                        {...sabor, id: id}
                    ]
                }
                res.send({...sabor, id: id})
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