const db = require('../database');
const clientesController = require('./clientesController');
const { _getEndereco, getImages } = require('./clientesController');
const { _getPadrao } = require('./entregadoresController');
const { _getIngredientes } = require('./pizzasController');

function getTipo(tipo){
    tipo = String(tipo)
    return tipo === '0' ? 'CAIXA' :
    tipo === '1' ? 'ENTREGA' : 
    tipo === '2' ? 'APLICATIVO' : 'TIPO'
}

function getItemDescricao(item){
    if(item.tipo === 0){
        return `(${item.pizza.tamanho.id}) ${item.pizza.tamanho.nome}`
    }else if(item.tipo === 1){
        const d = [item.bebida.nome, item.bebida.sabor, item.bebida.tamanho].filter(e => e !== '').join(' ')
        return `(${item.bebida.id}) ${d}`
    }else if(item.tipo === 2){
        return `(${item?.hamburguer?.id || '0'}) ${item?.hamburguer?.nome || 'HAMBURGUER'}`
    }else if(item.tipo === 3){
        return `(${item.outro.id}) ${item.outro.nome}`
    }else{
        return `(-1) ITEM DESCONHECIDO`
    }
}

function encryptIngredientes(finalIngredientesArray){
    const finalIngredientesString = finalIngredientesArray.map(finalIngrediente => {
        const currentTipoAdd = String(finalIngrediente.tipoAdd).toUpperCase()
        const tipoAddNumber = 
        ([0,'0','COM'].includes(currentTipoAdd)) ? 0
        : ([1,'1','SEM'].includes(currentTipoAdd)) ? 1
        : ([2,'2','POUCO'].includes(currentTipoAdd)) ? 2
        : ([3,'3','BASTANTE'].includes(currentTipoAdd)) ? 3 : 0

        return `(${finalIngrediente.id})[${tipoAddNumber}]`
    }).join(',')

    return finalIngredientesString
}

async function decryptIngredientes(originalIngredientesString, finalIngredientesString){
        const Arrayzer = (str) => String(str).replace(' ','').split(',') 
        const originalIngredientesArray = Arrayzer(originalIngredientesString)
        const finalIngredientesArray = Arrayzer(finalIngredientesString)

    return await Promise.all(
        finalIngredientesArray.map(async (finalIngrediente) => {
            const id = finalIngrediente.match(/\(\d+\)/)[0].replace(/[^\d]/g,'')

            let tipoAdd = finalIngrediente.replace(/[^\[0-9\]]/,'').replace(/[^0-9]/,'')
            
            if(tipoAdd === '0' && !originalIngredientesArray.includes(id)){//COM
                tipoAdd = 'COM'
            }else if(tipoAdd === '1' && originalIngredientesArray.includes(id)){//SEM
                tipoAdd = 'SEM'
            }else if(tipoAdd === '2'){//POUCO
                tipoAdd = 'POUCO'
            }else if(tipoAdd === '3'){//BASTANTE
                tipoAdd = 'BASTANTE'
            }else{
                tipoAdd = null
            }

            const ingr = !isNaN(id) ? await _getIngredientes(null, id) : [] 
            
            let _r =  {
                id: id,
                nome: ingr[0].nome,
                tipoAdd: tipoAdd
            }
            return _r
        }
    ))
}

const infoToCheckBeforeUpdate = {
    clientes: [{pedidoId: 0, cliente: {id: 0, nome: 0}}],
    valores: {pedidos: 0, total: 0, pago: 0, pendente: 0, taxas: 0, impressoes: 0},
}



module.exports = {
    andamento: [],
    andamentoClientes: [],
    andamentoItens: [],
    andamentoPagamentos:[],

    async novoPedido(req, res){
        const pool = db.pool
            let conn;
            try {
                conn = await pool.getConnection();
                const e = await conn.query(`insert into tbl_ped (cli_id) values (null)`)
                if(e) {
                    if(res){
                        res.send(e)
                    }else{
                        conn.end()
                        return(e)
                    }
                }
            } catch (err) {
                console.error(err, err.stack)
            } finally {
                if (conn) conn.end();
            }
    },

    async getInfoToCheckBeforeUpdate(req, res){
        res.send(infoToCheckBeforeUpdate)
    },

    getAndamento(req, res){
        const tipo = req?.query?.tipoGet
        const id = req?.query?.pedidoId || req?.query?.clienteId
        if(tipo && tipo === 'cliente' && id){
            res.send(this.andamentoClientes.filter(e => e.id === Number(id)))
        }else if(tipo && tipo === 'itens' && id){
            res.send(this.andamentoItens.filter(e => e.pedidoId === Number(id)))
        }else if(tipo && tipo === 'pagamentos' && id){
            res.send(this.andamentoPagamentos.filter(e => e.pedidoId === Number(id)))
        }else{
            res.send(this.andamento)
        }
    },

    async _getAndamento() {
        const pool = db.pool
        let conn;
        let result = []
        try {
            conn = await pool.getConnection();
            let rows = await conn.query(
            "SELECT "
            + "ped.ped_id, ped.cli_id, cli_nome, ped_tipo, " 
            + "arq_id, arq_ate, "
            + "ped_data_inic, ped_data_fim, "
            + "end_cep, end_log, end_comp, "
            + "bai_id, bai_desc, bai_taxa, "
            + "ponto_desc, ponto_n, "
            + "ponto_ref, ped_taxa, "
            + "entreg_id, entreg_nome, "
            + "pedloc_saida, ped_valor, "
            + "ped_status, ped_impr, ped_obs, "
            + "coalesce(sum(item_valor),0) + COALESCE(pl.ped_taxa,0) as total " 
            + "from tbl_ped as ped " 
            + "left join tbl_ped_itens using(ped_id) "
            + "left join tbl_ped_app using(ped_id) " 
            + "left join (tbl_ped_loc as pl "
            + "inner join (tbl_cad_loc_end as loc inner join tbl_cad_loc_bairros as bai using(bai_id)) "
            + "using(end_cep) "
            + "left join tbl_cad_entreg as entreg using(entreg_id)) "
            + "using(ped_id) " 
            + "left join tbl_ped_arq as arq using(ped_id) " 
            + "where ped_status = 'ANDAMENTO' "
            + "group by ped_id"
            );
            result = await Promise.all(rows.map(async (e) => {
                const numero = await getNumero(e.ped_id, e.cli_id)
                const itens = await getItens(e.ped_id)
                const pagamentos = await getPagamentos(e.ped_id)
                const cliente =  {
                    ...await clientesController._getAll('id', e.cli_id),
                    nome: e.cli_nome
                }
            
                const tipo = getTipo(e.ped_tipo)
        
                const arquivado = 
                e.arq_id 
                ? {id: e.arq_id, ate: e.arq_ate} 
                : null

                return {
                id: e.ped_id,
                dataInic: e.ped_data_inic,
                dataFim: e.ped_data_fim ,
                cliente: cliente, //{id: e.cli_id, nome: e.cli_nome},
                endereco: (e.end_cep ? {
                    cep: e.end_cep,
                    logradouro: e.end_log,
                    complemento: e.end_comp,
                    bairro: {id: e.bai_id, nome: e.bai_desc, taxa: e.bai_taxa},
                    local: e.ponto_desc,
                    numero: e.ponto_n,
                    referencia: e.ponto_ref,
                    taxa: e.ped_taxa, 
                    entregador: {id: e.entreg_id, nome: e.entreg_nome},
                    saida: e.pedloc_saida
                } : null),
                aplicativo: null,
                itens: itens, //[],
                pagamentos: pagamentos, //[],
                arq: arquivado,
                tipo: tipo,
                valor: e.total,
                status: e.ped_status,
                impr: e.ped_impr,
                observacoes: e.ped_obs,
                numero: numero,
            }})
            )

            async function getNumero(pedidoId, clienteId){
                let r = 1
                if(clienteId){
                    const pool = db.pool
                    let conn;
                        conn = await pool.getConnection();
                        let rows = await conn.query(
                            "SELECT count(*)+1 as numeroPedido from tbl_ped " 
                        + `WHERE tbl_ped.ped_id < ${pedidoId} ` 
                        + `and tbl_ped.cli_id = ${clienteId}`
                        )
                        r = rows[0].numeroPedido
                }
                return r
            }

            async function getItens(pedidoId){
                conn.release()
                let rows = await conn.query(
                    `SELECT * from tbl_ped_itens where ped_id = ${pedidoId}`
                )
                let r = rows.map(e => {return {
                    pedidoId: e.ped_id,
                    id: e.item_id,
                    tipo: e.item_tipo,
                    descricao: e.item_desc,
                    valor: e.item_valor,
                    observacoes: e.item_obs
                }})
                for(let item of r){
                    const subId = Number(item.descricao.slice(1, item.descricao.lastIndexOf(')')))
                    const subDesc = item.descricao.slice(item.descricao.lastIndexOf(')') + 2)
                    if(item.tipo === 0){//pizza
                        conn.release()
                        rows = await conn.query(
                            "SELECT "
                            + "ips.sabor_id, ips.sabor_desc, ips.tipo_id, "
                            + "tipo_desc, cadsab.sabor_num, "
                            + "cadsab.sabor_ingr as ingr_padrao, "
                            + "ips.sabor_ingr as ingr_final "
                            + "from tbl_ped_itens_ps as ips "
                            + "inner join tbl_cad_pz_tipos using(tipo_id) "
                            + "inner join tbl_cad_pz_sabores as cadsab using(sabor_id) "
                            + `where item_id = ${item.id} `
                            + "group by ips_id"
                        )
                        item.pizza = {
                            tamanho: {
                                id: subId,
                                nome: subDesc
                            },
                            sabores: await Promise.all(rows.map(async (e) => {
                                return{
                                id: e.sabor_id,
                                nome: e.sabor_desc,
                                numero: e.sabor_num,
                                tipo: {id: e.tipo_id, nome: e.tipo_desc},
                                ingredientes: await decryptIngredientes(e.ingr_padrao, e.ingr_final)
                            }})),
                            valor: item.valor,
                        }
                    }else if(item.tipo === 1){//bebida
                        conn.release()
                        rows = await conn.query(
                            "SELECT "
                            + "bebida_desc, bebida_tipo, bebida_tam, bebida_sabor "
                            + "from tbl_cad_bb "
                            + `where bebida_id = ${subId}`
                            )
                        item.bebida = {
                            id: subId,
                            nome: rows[0].bebida_desc,
                            tipo: rows[0].bebida_tipo,
                            imagem: rows[0].bebida_img,
                            tamanho: rows[0].bebida_tam * 1000,
                            sabor: rows[0].bebida_sabor,
                            valor: item.valor,
                        }
                    }else if(item.tipo === 2){//hamburguer
        
                    }else if(item.tipo === 3){//outro
                        conn.release()
                        rows = await conn.query(
                            "SELECT "
                            + "outro_desc "
                            + "from tbl_cad_outros "
                            + `where outro_id = ${subId}`
                        )
                        item.outro = {
                            id: subId,
                            nome: rows[0].outro_desc,
                            imagem: rows[0].outro_img,
                            valor: item.valor,
                        }
                    }
                }
                return r
            }

            async function getPagamentos(pedidoId) {
                conn.release()
                let rows = await conn.query(
                    `SELECT * from tbl_ped_pag where ped_id = ${pedidoId}`
                )
                let r = rows.map(e => {return {
                    id: e.pag_id,
                    tipo: e.pag_tipo,
                    valorPago: e.pag_valor,
                    valorRecebido: e.pag_recebido,
                    dataAdicionado: e.pag_da,
                    dataRecebido: e.pag_dr,
                    status: e.pag_status
                }})
                
                return r
            }

            this.andamento = result
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
        }
    },

    async updateCliente(req, res){
        const novoCliente = req.body.novoCliente
        let pedido = 
        !req.body.pedido.id 
        || req.body.pedido.id === 0 
        || req.body.pedido.id === ''
        ? await this.novoPedido() : req.body.pedido

            const pool = db.pool
            let conn;
            try {
                conn = await pool.getConnection();

                let data = [
                    (novoCliente.id || null),
                    (novoCliente.nome || null)
                ]
                const e = await conn.query(
                    "UPDATE tbl_ped set cli_id=?, cli_nome=? "
                    + `where ped_id = ${pedido.id}`, data) 

                    pedido.cliente = novoCliente

                if(!novoCliente.id && !novoCliente.nome){
                    pedido = await this._updateTipo(pedido, 4) 
                }else if(pedido.tipo === null || pedido.tipo === 'TIPO'){
                        const novoTipo = await this.getCostumeTipo(pedido.cliente)
                        pedido = await this._updateTipo(pedido, novoTipo)
                    }else if(pedido.tipo === 'ENTREGA' && novoCliente.id){
                        pedido = await this._updateTipo(pedido, 1) 
                    }else if(!novoCliente.id){
                        pedido = await this._updateTipo(pedido, 4) 
                    }
                    await this._getAndamento()
                    const novoPedido = this.andamento.find(a => a.id === pedido.id)
                    res.send(novoPedido)
            } catch (err) {
                console.error(err, err.stack)
            } finally {
                if (conn) return conn.end();
            }
    },

    async updateTipo(req, res){
        const pedido = req.body?.pedido
        const novoTipo = req.body?.novoTipo  
        if(pedido && novoTipo > -1){
            let novoPedido = await this._updateTipo(pedido, novoTipo)
            await this._getAndamento()
            res.send(this.andamento.filter(a => a.id === novoPedido.id)[0])
        }
    },

    async _updateTipo(pedido, novoTipo){
            const pool = db.pool
            let conn;
            try {
                let data = [
                    novoTipo
                ]
                conn = await pool.getConnection();
                const e = await conn.query("UPDATE tbl_ped set ped_tipo=? "
                    + `where ped_id = ${pedido.id}`, data)

                    conn.release()
                    await conn.query("delete from tbl_ped_app "
                    + `WHERE ped_id = ${pedido.id}`)

                    let novoEndereco = null
                 
                    if(novoTipo === 1){
                        novoEndereco = await _getEndereco(pedido.cliente)
                    }

                    pedido.tipo = getTipo(novoTipo)
                    pedido = await this._updateEndereco(pedido, novoEndereco)
                    pedido = await this._updateAplicativo(pedido, null)

            } catch (err) {
                console.error(err, err.stack)
            } finally {
                if (conn) conn.end();
                return pedido
            }
    },

    async updateEndereco(req, res){
        const pedido = req.body?.pedido
        const novoEndereco = req.body?.novoEndereco  
        if(pedido && novoEndereco){
            let novoPedido = await this._updateEndereco(pedido, novoEndereco)
            await this._getAndamento()
            res.send(this.andamento.filter(a => a.id === novoPedido.id)[0])
        }
    },

    async _updateEndereco(pedido, novoEndereco){
            const pool = db.pool
            let conn;
            try {
                conn = await pool.getConnection();
                await conn.query("delete from tbl_ped_loc "
                    + `WHERE ped_id = ${pedido.id}`)

                        if(novoEndereco){
                            novoEndereco.taxa = novoEndereco?.bairro?.taxa ?? 0
                            novoEndereco.entregador = pedido?.endereco?.entregador ?? await _getPadrao()
                            let data = [
                                pedido.id || null,
                                novoEndereco.cep || null,
                                novoEndereco.local || null,
                                novoEndereco.numero || null,
                                novoEndereco.referencia || null,
                                novoEndereco.taxa || null, 
                                novoEndereco.entregador.id || null
                            ]
                            conn.release()
                            const e = await conn.query(
                                "insert into tbl_ped_loc "
                                + "(ped_id, end_cep, ponto_desc, "
                                + "ponto_n, ponto_ref, ped_taxa, entreg_id) "
                                + "values (?,?,?,?,?,?,?) ", 
                                data)
                        }
                    
                    pedido = {...pedido, endereco: novoEndereco}
            } catch (err) {
                console.error(err, err.stack)
            } finally {
                if (conn) conn.end();
                return pedido
            }
    },

    async updateTaxa(req, res){
        const pedido = req.body?.pedido
        const novaTaxa = req.body?.novaTaxa  
        if(pedido && Number(novaTaxa) >= 0){
            let r = await this._updateTaxa(pedido, novaTaxa)
            res.send(r)
            r && await this._getAndamento()
        }
    },

    async _updateTaxa(pedido, novaTaxa){
            const pool = db.pool
            let conn;
            let data = [
                novaTaxa
            ]
            try {
                conn = await pool.getConnection();
                await conn.query("update tbl_ped_loc set ped_taxa=? "
                    + `WHERE ped_id = ${pedido.id}`, data)
                    return true
            } catch (err) {
                console.error(err, err.stack)
                return false
            } finally {
                if (conn) conn.end();
            }
    },

    async updateEntregador(req, res){
        const pedido = req.body?.pedido
        const novoEntregador = req.body?.novoEntregador  
        if(pedido && novoEntregador){
            let r = await this._updateEntregador(pedido, novoEntregador)
            res.send(r)
            r && await this._getAndamento()
        }
    },

    async _updateEntregador(pedido, novoEntregador){
            const pool = db.pool
            let conn;
            let data = [
                novoEntregador.id
            ]
            try {
                conn = await pool.getConnection();
                await conn.query("update tbl_ped_loc set entreg_id=? "
                    + `WHERE ped_id = ${pedido.id}`, data)
                    return true
            } catch (err) {
                console.error(err, err.stack)
                return false
            } finally {
                if (conn) conn.end();
            }
    },

    async updateAplicativo(req, res){
        const pedido = req.body?.pedido
        const novoAplicativo = req.body?.novoAplicativo  
        if(pedido && novoAplicativo){
            let novoPedido = await this._updateAplicativo(pedido, novoAplicativo)
            await this._getAndamento()
            res.send(this.andamento.filter(a => a.id === novoPedido.id)[0])
        }
    },

    async _updateAplicativo(pedido, novoAplicativo){
            const pool = db.pool
            let conn;
            try {
                conn = await pool.getConnection()
                    await conn.query("delete from tbl_ped_app "
                    + `WHERE ped_id = ${pedido.id}`)

                        if(novoAplicativo){
                            conn.release()
                            // novoEndereco.taxa = novoEndereco.bairro.taxa
                            // novoEndereco.entregador = pedido.endereco.entregador ?? await _getPadrao()
                            // let data = [
                            //     pedido.id || null,
                            //     novoAplicativo.cep || null,
                            //     novoAplicativo.local || null,
                            //     novoAplicativo.numero || null,
                            //     novoAplicativo.referencia || null,
                            //     novoAplicativo.taxa || null, 
                            //     novoAplicativo.entregador.id || null
                            // ]
                            // const e = await conn.query(
                            //     "insert into tbl_ped_loc "
                            //     + "(ped_id, end_cep, ponto_desc, "
                            //     + "ponto_n, ponto_ref, ped_taxa, entreg_id) "
                            //     + "values (?,?,?,?,?,?,?) ", 
                            //     data)
                                
                        }
                    
                    pedido = {...pedido, aplicativo: novoAplicativo}
            } catch (err) {
                console.error(err, err.stack)
            } finally {
                if (conn) conn.end();
                return pedido
            }
    },

    async getCostumeTipo(cliente){
        const pool = db.pool
        let conn;
        let result = 4
        try {
          conn = await pool.getConnection();
            const rows = await conn.query(
                "SELECT "
                + "coalesce(case when ped_tipo=0 then 1 else 0 end,0) as cx, "
                + "coalesce(case when ped_tipo=1 then 1 else 0 end,0) as entr, "
                + "coalesce(count(ped_id),0) as peds, "
                + "coalesce(end_cep,0) as cep "
                + "from tbl_ped right join tbl_cad_cli using(cli_id) "
                + `where cli_id = ${cliente.id}`
            )
            const res = rows[0]

            result = 
            (res.peds === 1 && res.cep !== 0)
            || (res.entr > res.cx) ? 1 : 0

        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if (conn) conn.end()
            return result
        }
    },
    
    async updateItem(req, res){
        const pedido = req.body?.pedido
        const novoItem = req.body?.novoItem  
        if(pedido && novoItem){
            const novoPedido = await this._updateItem(pedido, novoItem)
            await this._getAndamento()
            res.send(this.andamento.filter(a => a.id === novoPedido.id)[0])
        }
    },

    async _updateItem(pedido, novoItem){
            if(pedido && novoItem){
                const pool = db.pool
                let conn;
                try {
                    conn = await pool.getConnection()
                    
                    let data = [
                        pedido.id || null,
                        novoItem.tipo,
                        getItemDescricao(novoItem),
                        novoItem.valor || null,
                        novoItem?.observacoes?.toUpperCase() || null,
                    ]

                    const str = novoItem.id > 0

                    ? "update tbl_ped_itens set "
                    + "ped_id=?, item_tipo=?, item_desc=?, "
                    + "item_valor=?, item_obs=? " 
                    + `where item_id = ${novoItem.id}`

                    : "insert into tbl_ped_itens "
                    + "(ped_id, item_tipo, item_desc, "
                    + "item_valor, item_obs) "
                    + "values (?,?,?,?,?) "

                    const e = await conn.query(str, data)

                    if(e) {
                        if(e.insertId > 0) novoItem.id = e.insertId

                        if(novoItem.tipo === 0){

                            conn.release()
                            await conn.query(
                                "delete from tbl_ped_itens_ps "
                                + `where item_id = '${novoItem.id}'`)

                            for(let sabor of novoItem.pizza.sabores){
                                data = [
                                    novoItem.id || null,
                                    sabor.id || null,
                                    sabor.tipo.id || null,
                                    sabor.nome,
                                    encryptIngredientes(sabor.ingredientes),
                                ]

                                conn.release()
                                await conn.query(
                                    "insert into tbl_ped_itens_ps "
                                    + "(item_id, sabor_id, tipo_id, "
                                    + "sabor_desc, sabor_ingr) "
                                    + "values (?,?,?,?,?)", data
                                )
                            }
                        }else if(novoItem.tipo === 2){
                            //hamburguer
                        }
                     
                    }

                } catch (err) {
                    console.error(err, err.stack)
                } finally {
                    if (conn) conn.end();
                    return pedido
                }
            }
    },

    async copyItem(req, res){
        const pedido = req.body?.pedido
        const item = req.body?.item  
        const qtd = req.body?.qtd  
        if(pedido && qtd > 0 && qtd <= 10 && item){
            const novoPedido = await this._copyItem(pedido, item, qtd)
            await this._getAndamento()
            res.send(this.andamento.filter(a => a.id === novoPedido.id)[0])
        }
    },

    async _copyItem(pedido, item, qtd){
            if(pedido && item && qtd){
                const pool = db.pool
                let conn;
                try {
                    conn = await pool.getConnection()
                    
                    let data = [
                        pedido.id || null,
                        item.tipo,
                        getItemDescricao(item),
                        item.valor || null,
                        item?.observacoes?.toUpperCase() || null,
                    ]

                    const str = 
                    `insert into tbl_ped_itens 
                    (ped_id, item_tipo, item_desc, 
                    item_valor, item_obs) 
                    values (?,?,?,?,?) `

                    let ids = []
                    for(let i = 0; i < qtd; i++){
                        const e = await conn.query(str, data)
                        if(e.insertId > 0) ids.push(e.insertId)
                    }

                    if(ids.length > 0) {

                        if(item.tipo === 0){

                            for(let i of ids){
                                for(let sabor of item.pizza.sabores){
                                    data = [
                                        i,
                                        sabor.id || null,
                                        sabor.tipo.id || null,
                                        sabor.nome,
                                        encryptIngredientes(sabor.ingredientes),
                                    ]
    
                                    conn.release()
                                    await conn.query(
                                        "insert into tbl_ped_itens_ps "
                                        + "(item_id, sabor_id, tipo_id, "
                                        + "sabor_desc, sabor_ingr) "
                                        + "values (?,?,?,?,?)", data
                                    )
                                }
                            }
                        }else if(item.tipo === 2){
                            //hamburguer
                        }
                     
                    }

                } catch (err) {
                    console.error(err, err.stack)
                } finally {
                    if (conn) conn.end();
                    return pedido
                }
            }
    },


    async deleteItem(req, res){
        const pedido = req.body?.pedido
        const item = req.body?.item  
        if(pedido && item?.id){
            const novoPedido = await this._deleteItem(pedido, item)
            await this._getAndamento()
            res.send(this.andamento.filter(a => a.id === novoPedido.id)[0])
        }else{
            res.sendStatus(400)
        }
    },

    async _deleteItem(pedido, item){
            if(pedido && item){
                const pool = db.pool
                let conn;
                try {
                    conn = await pool.getConnection()
                
                    const str = `delete from tbl_ped_itens where item_id = ${item.id} `

                    await conn.query(str)

                    pedido = {id: pedido.id}

                } catch (err) {
                    console.error(err, err.stack)
                } finally {
                    if (conn) conn.end();
                    return pedido
                }
            }
    },

    async updatePagamento(req, res){
        const pedido = req.body?.pedido
        const novoItem = req.body?.novoItem  
        if(pedido && novoItem){
            const novoPedido = await this._updateItem(pedido, novoItem)
            await this._getAndamento()
            res.send(this.andamento.filter(a => a.id === novoPedido.id)[0])
        }
    },

    async _updatePagamento(pedido, novoItem){
            if(pedido && novoItem){
                const pool = db.pool
                let conn;
                try {
                    conn = await pool.getConnection()
                    
                    let data = [
                        pedido.id || null,
                        novoItem.tipo || null,
                        getItemDescricao(novoItem),
                        novoItem.valor || null,
                        novoItem.observacoes || null,
                    ]


                    const str = novoItem.id > 0
                    ? "insert into tbl_ped_itens "
                    + "(ped_id, item_tipo, item_desc, "
                    + "item_valor, item_obs) "
                    + "values (?,?,?,?,?) "

                    : "update tbl_ped_itens set "
                    + "ped_id=?, item_tipo=?, item_desc=?, "
                    + "item_valor=?, item_obs=? " 
                    + `where item_id = ${novoItem.id}`

                    const e = await conn.query(str, data)

                    if(e) {
                        if(e.insertId > 0) novoItem.id = e.insertId

                        if(novoItem.tipo === 0){

                            conn.release()
                            await conn.query(
                                "delete from tbl_ped_itens_ps "
                                + `where item_id = '${novoItem.id}'`)

                            for(let sabor of novoItem.pizza.sabores){
                                data = [
                                    novoItem.id || null,
                                    sabor.id || null,
                                    sabor.tipo.id || null,
                                    sabor.nome,
                                    encryptIngredientes(sabor.ingredientes),
                                ]
                                conn.release()
                                await conn.query(
                                    "insert into tbl_ped_itens_ps "
                                    + "(item_id, sabor_id, tipo_id, "
                                    + "sabor_desc, sabor_ingr) "
                                    + "values (?,?,?,?,?)"
                                )
                            }
                        }else if(novoItem.tipo === 2){
                            //hamburguer
                        }
                     
                    }

                } catch (err) {
                    console.error(err, err.stack)
                } finally {
                    if (conn) conn.end();
                    return pedido
                }
            }
    },
}



