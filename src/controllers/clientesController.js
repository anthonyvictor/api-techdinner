const db = require('../database')
const { base64ToBlob, blobStringToBlob } = require('../util/format')
const { _getEnderecos } = require('./enderecosController')
//const fs = require('fs')

// async function blobToImg(data){
//     return data
//     if(data){
//         let buff = fs.readFileSync(data, 'utf-8');
//         let res = fs.writeFileSync('aaa.png', buff, 'base64')

//         return buff
//         // return  buff.toString('base64'); //base64data =

//         // let buff = new Buffer.from(data, 'base64');
//         // fs.writeFileSync('imagem', buff);
//         // return new Buffer.
//     }else{
//         return null
//     }
// }

module.exports = {
    clientes: [],

    async getAll(req, res){
        if(req?.query?.id){
            let img = await this._getImages([req.query.id])
            res.send(
                {
                    ...this.clientes.filter(e => e.id === Number(req.query.id))[0], 
                    imagem: (img[0]?.imagem)
                }
            )
        }else{
            res.send(this.clientes)
        }
    },

    async _getAll(getBy=null, id=null) {
        let where = ''
        if(getBy === 'min'){
            where = `where cli_id > ${id} `
        }else if(getBy === 'id'){
            where = `where cli_id = ${id} `
        }
        const pool = db.pool
        let conn;
        let result = []
        try {
          conn = await pool.getConnection();
          const rows = await conn.query(
            "SELECT cli.cli_id as id, cli.cli_nome as nome, "
          + "GROUP_CONCAT(distinct ctts.contato SEPARATOR ',') AS contato, " 
          + "GROUP_CONCAT(distinct tags.tag SEPARATOR ',') as tags, " 
          + "cli.end_cep AS cep, ender.end_log AS logradouro, "
          + "ender.end_comp AS complemento, "
          + "bair.bai_desc AS bairro, " 
          + "cli.ponto_desc AS local, cli.ponto_n AS numero, " 
          + "cli.ponto_ref AS referencia, coalesce(bair.bai_taxa,0) AS taxa, " 
          + "coalesce(count(distinct ped.ped_id),0) AS pedidos, "
          + "COALESCE(SUM(distinct ped_valor),0) AS valorGasto, " 
          + "CASE WHEN MAX(ped_data_inic) !='' THEN " 
          + "DATE_FORMAT(MAX(ped_data_inic),'%d/%m/%Y') END AS ultPedido " 
          + "from tbl_cad_cli as cli " 
          + "left join tbl_cad_cli_ctt as ctts using(cli_id) " 
          + "left join tbl_cad_cli_tag as tags using(cli_id) " 
          + "left join tbl_ped as ped using(cli_id) " 
          + "left join (tbl_cad_loc_end as ender " 
          + "inner join tbl_cad_loc_bairros as bair using(bai_id)) using(end_cep) " 
          + where 
          + "group by cli.cli_id " 
          + "order by cli.cli_id asc "
          + 'limit 50'
          );
          result = await Promise.all(rows.map(async e => {
            return {
                id: e.id,
                nome: e.nome, 
                contato: (e.contato ? e.contato.split(',') : []),
                tags: (e.tags ? e.tags.split(',') : []),
                endereco: (!e.cep ? null : {
                    logradouro: e.logradouro,
                    complemento: e.complemento,
                    numero: e.numero,
                    local: e.local,
                    cep: e.cep,
                    bairro: {nome: e.bairro, taxa: e.taxa},
                    referencia: e.referencia,
                }),
                pedidos: e.pedidos,
                ultPedido: e.ultPedido,
                valorGasto: e.valorGasto,
                valorPendente: await getValorPendente(e.id)
            }}))


            async function getValorPendente(clienteId){
                conn.release()
                const res =  await conn.query(
                    "SELECT COALESCE(SUM(falta),0) as valorPendente "
                    + "from (SELECT IF(PED_STATUS='PENDENTE',ped_falta,0) AS falta "
                    + `from tbl_ped WHERE cli_id = ${clienteId} and ped_status <> 'ANDAMENTO' `
                    + "order by ped_data_inic desc limit 3) AS STR1"
                )
                return res[0].valorPendente
            }


            if(getBy === 'id'){
                return result[0]
            }else if(getBy === 'min'){
                this.clientes = [...this.clientes, ...result]
            }else{
                this.clientes = result
            }
        } catch (err) {
            console.error(err, err.stack)
        } finally {
            if(result.length > 0 && getBy !== 'id'){ 
                let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
                this._getAll('min', max)
            }
            if (conn) conn.end()
        }
      },

      async _getEndereco(cliente){
        if(cliente.id){
                const pool = db.pool
                let conn;
                let result = null
                try {
                    conn = await pool.getConnection();
                    const rows = await conn.query(
                        "SELECT " 
                        + "cli.end_cep AS cep, "
                        + "cli.ponto_desc AS local, cli.ponto_n AS numero, " 
                        + "cli.ponto_ref AS referencia " 
                        + "from tbl_cad_cli as cli " 
                        + `where cli_id = ${cliente.id}`
                    )

                for(let e of rows){
                    result = (!e.cep ? null : {
                        ...await _getEnderecos(null, e.cep),
                        numero: e.numero,
                        local: e.local,
                        referencia: e.referencia,
                    })
                }
                } catch (err) {
                    console.error(err, err.stack)
                } finally {
                    if (conn) conn.end()
                    return result
                }
        }else{return null}
      },

    async getImages(req, res) {
        if(req.query.ids){
            res.send(await this._getImages(req.query.ids))
        }
    
    },

    async _getImages(ids) {
        return []
            // const pool = db.pool
            // let conn;
            // try {
            //     conn = await pool.getConnection();
            //     const rows = await conn.query(
            //         "SELECT cli_id as id, image as imagem from tbl_cad_cli_img "
            //     + `where cli_id in (${ids.join(', ')})`
            //     );
            //     return rows
            // } catch (err) {
            //     return []
            // } finally {
            //     if (conn) conn.end();
            // }    
    },

    async delete(req, res){
        const id = req.body.id
        if(id){
            const pool = db.pool
            let conn;
            try {
                conn = await pool.getConnection();
                conn.query(`DELETE from tbl_cad_cli where cli_id = ${id}`)
                .then(() => this.clientes = this.clientes.filter(e => e.id !== id))
                .catch((e) => {
                    throw e
                })
                .finally((e) => {
                    res.send(e)
                    return conn.end()
                })
            } catch (err) {
                console.error(err, err.stack)
            } finally {
                if (conn) return conn.end();
            }
        }else{
            res.sendStatus(404)
        }
    },

    async save(req, res){
        const cliente = req.body.cliente
        let id = cliente.id
            const pool = db.pool
            let conn;
            try {
                conn = await pool.getConnection();

                let data = [
                    (cliente.nome || null),
                    (cliente?.endereco?.cep || null),
                    (cliente?.endereco?.local || null),
                    (cliente?.endereco?.numero || null),
                    (cliente?.endereco?.referencia || null)
                ]
                const str = id
                ? `UPDATE tbl_cad_cli set cli_nome=?, 
                end_cep=?, ponto_desc=?, ponto_n=?, ponto_ref=? 
                where cli_id = ${id}`

                : `INSERT INTO tbl_cad_cli 
                (cli_nome, end_cep, ponto_desc, ponto_n, ponto_ref) 
                VALUES (?,?,?,?,?)`

                const e = await conn.query(str, data)
                if(e) {
                    id = e.insertId > 0 ? e.insertId : id
                    conn.release()
                    await conn.query(`delete from tbl_cad_cli_ctt where cli_id = ${id}`)
                    // conn.release()
                    // await conn.query(`delete from tbl_cad_cli_img where cli_id = ${id}`) //IMAGEM
                    conn.release()
                    await conn.query(`delete from tbl_cad_cli_tag where cli_id = ${id}`)
                 
                    for(contato of cliente.contato || []){
                        data = [id, contato]
                        conn.release()
                        let r = await conn.query(`insert into tbl_cad_cli_ctt (cli_id, contato) values (?,?)`, data)
                    }
                    
                    for(tag of cliente.tags || []){
                        data = [id, tag]
                        conn.release()
                        let r = await conn.query(`insert into tbl_cad_cli_tag (cli_id, tag) values (?,?)`, data)
                    }
                    
                    // //tirar await dps
                    // if(cliente.imagem){
                    //     const img = 
                    //     String(cliente.imagem).startsWith('blob:')
                    //     ? await blobStringToBlob(cliente.imagem)
                    //     : base64ToBlob(cliente.imagem)
                    //     data = [id, img]
                    //     conn.release()
                    //     let r = await conn.query(`insert into tbl_cad_cli_img (cli_id, image) values (?,?)`, data)
                    //     console.log(r)
                    // }
                    if(e.affectedRows > 0){
                        this.clientes = [
                            ...this.clientes.filter(cli => cli.id !== id),
                            {...cliente, id: id}
                        ]
                    }
                    
                    // if(e.data.insertId){
                    //     clientes = [...this.clientes,     
                    // }else{
                        
                    // }

                    res.send({...cliente, id: id})
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



