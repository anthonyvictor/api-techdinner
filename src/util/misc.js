const db = require('../database')
const app = require('../../app')
const fs = require('fs')
const { json } = require('express/lib/response')
require('dotenv/config')
// const path = require('path')


function getUrls(){
    const ip = require('ip').address('public')
    const protocol = process.env.PROTOCOL || 'http'
    const port = process.env.PORT || '8081'
    
    return { 
        staticUrl: `${protocol}://${ip}:${port}`,
        localUrl: `http://localhost:${port}`,
        port
    }
}

function getImageUrl({type, id}){
    // imagens // e.bebida_id
    const filename = `src/images/${type}/${id}.png`
    const {staticUrl} = getUrls()
        return (fs.existsSync(filename))
            ? `${staticUrl}/static/${type}/${id}.png` //path.resolve(filename) 
            : null
}

module.exports = {

    async getImagesFromBD(idColumn, imageColumn, table){
      const pool = await db.pool
      let conn;
      try {
          conn = await pool.getConnection();
          const rows = await conn.query(
            `
                SELECT 
                ${idColumn} AS id, 
                ${imageColumn} AS imagem  
                FROM ${table} 
            `
          );
            const result = rows.map(e => { return{id: e.id, imagem: e.imagem}})
          
              return result

      } catch (err) {
          return []
      } finally {
          if (conn) conn.end();
      }    
},

    async downloadImages(from, imagesObj){
        const imagens = imagesObj
        for(let img of imagens){
            try{
                if(img.imagem){
                    const fs = require('fs')
                    const name = `src/images/${from}/${img.id}.png`
                    const buffer = Buffer.from(img.imagem)
                    fs.createWriteStream(name).write(buffer)
                }
            }catch{
                console.log(typeof img.imagem, img.imagem)
            }
                // console.log(name, buffer)
            
        }
    },

    equals(a, b){
        return JSON.stringify(a) === JSON.stringify(b)
    },

    getUrls: getUrls, getImageUrl: getImageUrl,

    isNEU (val) {
        return (
          // assim, nós também podemos verificar valores undefined. null == undefined = true
          // nós queremos que {} retorne false. não podemos usar !! porque !!{} retorna true
          // !!{} = true and !!{name:"yilmaz"} = true. !! não funciona com objetos
          !val ||
          val === null ||
          val === "" ||
          val === 'null' ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof(val) === 'object' && Object.keys(val).length === 0)
      
        );
      }
}