const db = require('../database')
const pedidosController = require('./pedidosController')
const authController = require('./authController')


function getDataInic(d){
    let r = new Date(d)
    r = r.toISOString().split('T')[0] + ' 05:00:00'
    return r
}
function getDataFim(d){
    let r = new Date(d)
    r.setDate(r.getDate() + 1)
    r = r .toISOString().split('T')[0] + ' 04:59:59'
    return r
}

function today(){
    const data = new Date()
    
    const dataOntem = data
    dataOntem.setDate(data.getDate() - 1)
    
    let dataInic = null, 
    dataFim = null
    
    if(data.getHours() < 5){
        dataInic = getDataInic(dataOntem) // = dataOntem
            dataFim = getDataFim(dataOntem) // = dataHoje
        }else{
            dataInic = getDataInic(data)
            dataFim = getDataFim(data)
        }
        return { dataInic, dataFim }
}

module.exports = {

    async getRelatorios(req, res) {
        const {ids, tipos, periodos, status} = req.query
        const _periodos = periodos && periodos?.length > 0 
        ? periodos.map(e => {
            const pe = JSON.parse(e)
            return {
            dataInic: getDataInic(pe.dataInic), 
            dataFim: getDataFim(pe.dataFim)
        }})
        : [today()]

        const _status = status ?? ['FINALIZADO', 'PENDENTE', 'CANCELADO', 1, 2, 3]

        const r = await pedidosController._getPedidos(
            {
                ids, tipos, 
                periodos: _periodos,
                status: _status
            }
        )

        res.send(r)
    },

    async retomar(req, res) {
        try{
            authController.authAdmin(req)
            
            const pedido = req.params
                let r = await this._retomar(pedido)
                if(r){
                    res.sendStatus(200)
                }else{
                    throw new Error('Algo deu errado!')
                }
                r && (await pedidosController.refreshAndamento())
            
        }catch(err){
            console.error(err, err.stack)
            if(err.message === 'You doesnt have permission for that!'){
                res.status(403).send('Proibido')
            }else {
                res.status(500).send(err.message)
            }
        }
    },

    async _retomar(pedido) {
        const pool = await db.pool
        let conn
        let data = ['ANDAMENTO']
        try {
            conn = await pool.getConnection()
            await conn.query(`
                UPDATE tbl_ped 
                SET ped_status=? 
                WHERE ped_id = ${pedido.id}`, data)
            return true
        } catch (err) {
            console.error(err, err.stack)
            return false
        } finally {
            if (conn) conn.end()
        }
    },

}