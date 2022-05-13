// const db = require('../database')

const users = [
    {
        name: 'Antonio Costa',
        username: 'antonio', 
        email: 'tonhopz12@gmail.com', 
        phone: '71 982261684', 
        enterprise: 'Pizzaria Delicia da Bahia',
        post: 'admin', 
        password: 'asenha159'
    },
    
    
    {
        name: 'Luziana Gonçalves',
        username: 'luziana', 
        email: 'luzianabahia@gmail.com', 
        enterprise: 'Pizzaria Delicia da Bahia',
        post: 'operator', 
        password: 'luzi123'
    },
    
    
    {
        name: 'Anthony Victor', 
        username: 'thonny',
        email: 'thonnyvrc@gmail.com', 
        phone: '71 984479191', 
        enterprise: {
            name: 'Pizzaria Delicia da Bahia',
            cnpj: '20434505000171',
            phoneNumber: '71988726927',
            address: 'Ladeira do Jardim Zoológico, 427B - Ondina, CEP: 40.170-720'
        },
        post: 'dev', 
        password: 'asenha159'
    },
]

module.exports = {

    auth(req, res){
        let data = req.headers.authorization.split(' ')[1];
        let buff = Buffer.from(data, 'base64');
        let text = buff.toString('utf-8');
        const user = text.split(':')[0].toLowerCase().trim()
        const password = text.split(':')[1]
        if(user !=='' && password !==''){
            const found = users.find(u => (
                u?.username === user ||
                u?.email === user ||
                u?.phone === user
            ) && u.password === password
            )
            if(found){
                    res.send({...found, password: password})
            }else{
                res.sendStatus(403)
            }
        }else{
            res.send({})
        }

    },

    isDev(username){
            const user = users.find(u => u.username === username)
            return (user?.post ?? '') === 'dev'
    },

    isAdmin(username){
        try{
            const found = users.filter(u => u.username === username)
            const user = found[0]
            return (user.post === 'admin') || this.isDev(username)
        }catch(err){
            return 'User does not exists'
        }
    },

    authAdmin(req){
        let data = req.headers.authorization.split(' ')[1];
        let buff = Buffer.from(data, 'base64');
        let text = buff.toString('utf-8');
        const user = text.split(':')[0].toLowerCase().trim()
        const adminAuth = authController.isAdmin(user)
        if(adminAuth === false) throw new Error('You doesnt have permission for that!')
        if(adminAuth !== true) throw new Error(adminAuth)
    },


    async _getAll(min) {
        // const minId = min 
        // ? `where bebida_id > ${min} ` : '' 
        // const pool = await db.pool
        // let conn;
        // let result = []
        // try {
        //   conn = await pool.getConnection();
        // const rows = await conn.query(
        //     'SELECT * from tbl_cad_bb '
        //     + minId
        //     + 'limit 10'
        // );
        // result = rows.map(e=> {return {
        //     id: e.bebida_id,
        //     nome: e.bebida_desc,
        //     imagem: e.bebida_img,
        //     tipo: e.bebida_tipo,
        //     sabor: e.bebida_sabor,
        //     tamanho: e.bebida_tam,
        //     valor: e.bebida_valor,
        //     ativo: e.bebida_ativa,
        //     visivel: e.bebida_visivel,
        //     vendidos: e.bebida_qtd
        // }})
        // if(min){
        //     this.bebidas = [...this.bebidas, ...result]
        // }else{
        //     this.bebidas = result
        // }
        // } catch (err) {
        //     console.error(err, err.stack)
        // } finally {
        //     if (conn) conn.end()
        //     if(result.length > 0){
        //         let max= result.map(e => e.id).reduce((max, val) => max > val ? max : val)
        //         this._getAll(max)
        //     }
        // }
    }
}