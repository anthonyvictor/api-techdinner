const db = require("../database");

module.exports = {
  enderecos: [],
  locais: [],
  bairros: [],

  getAll(req, res) {
    res.send({
      enderecos: this.enderecos,
      locais: this.locais,
      bairros: this.bairros,
    });
  },

  async _getEnderecos(min, cep = 0) {
    let minId = min
      ? `where end_id > ${min} `
      : cep > 0
      ? `where end_cep = ${cep} `
      : "";
    const pool = db.pool;
    let conn;
    let result = [];
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT e.end_id, " +
          "e.bai_id, b.bai_desc, b.bai_taxa, " +
          "e.end_cep, e.end_log, e.end_comp " +
          "FROM tbl_cad_loc_end as e " +
          "inner join tbl_cad_loc_bairros as b using(bai_id) " +
          minId +
          "order by end_id asc limit 50 "
      );
      result = rows.map((e) => {
        return {
          id: e.end_id,
          logradouro: e.end_log,
          complemento: e.end_comp,
          cep: e.end_cep,
          bairro: {
            id: e.bai_id,
            nome: e.bai_desc,
            taxa: e.bai_taxa,
          },
        };
      });
      if (min) {
        this.enderecos = [...this.enderecos, ...result];
      } else if (cep > 0) {
        return result[0];
      } else {
        this.enderecos = result;
      }
    } catch (err) {
      console.error(err, err.stack);
    } finally {
      if (conn) conn.end();
      if (result.length > 0 && cep === 0) {
        let max = result
          .map((e) => e.id)
          .reduce((max, val) => (max > val ? max : val));
        this._getEnderecos(max);
      }
    }
  },

  async getTaxaOriginal(req, res) {
    res.send({ taxa: 100000 });
  },

  async _getLocais(min, id=null) {
    const where = min 
    ? `where ponto_id > ${min} ` 
    : id ? `where ponto_id = ${id} ` : ""
    const pool = db.pool;
    let conn;
    let result = [];
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT p.ponto_id as id, " +
          "p.end_cep as cep, " +
          "p.ponto_desc as local, " +
          "p.ponto_n as numero, " +
          "e.bai_id, b.bai_desc, b.bai_taxa, " +
          "e.end_log, e.end_comp " +
          "FROM tbl_cad_loc_pontos as p " +
          "inner join (tbl_cad_loc_end as e " +
          "inner join tbl_cad_loc_bairros as b using(bai_id)) using(end_cep) " +
          where +
          "limit 50"
      );
      result = rows.map((e) => {
        return {
          id: e.id,
          cep: e.cep,
          local: e.local,
          numero: e.numero,
          logradouro: e.end_log,
          complemento: e.end_comp,
          bairro: {
            id: e.bai_id,
            nome: e.bai_desc,
            taxa: e.bai_taxa,
          },
        };
      });
      
      if(id){
        return result[0]
      } else if (min) {
        this.locais = [...this.locais, ...result];
      } else {
        this.locais = result;
      }
    } catch (err) {
      console.error(err, err.stack);
    } finally {
      if (conn) conn.end();
      if (result.length > 0) {
        let max = result
          .map((e) => e.id)
          .reduce((max, val) => (max > val ? max : val));
        this._getLocais(max);
      }
    }
  },

  async _getBairros(min) {
    const minId = min ? `where bai_id > ${min} ` : "";
    const pool = db.pool;
    let conn;
    let result = [];
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT tbl_cad_loc_bairros.bai_id as id, " +
          "tbl_cad_loc_bairros.bai_desc as nome, " +
          "tbl_cad_loc_bairros.bai_taxa as taxa " +
          "FROM tbl_cad_loc_bairros " +
          minId +
          "limit 50"
      );
      result = rows.map((e) => {
        return {
          id: e.id,
          nome: e.nome,
          taxa: e.taxa,
        };
      });
      if (min) {
        this.bairros = [...this.bairros, ...result];
      } else {
        this.bairros = result;
      }
    } catch (err) {
      console.error(err, err.stack);
    } finally {
      if (conn) conn.end();
      if (result.length > 0) {
        let max = result
          .map((e) => e.id)
          .reduce((max, val) => (max > val ? max : val));
        this._getBairros(max);
      }
    }
  },

  async _getAll() {
    this._getEnderecos();
    this._getLocais();
    this._getBairros();
  },

  async save(req, res) {
    const tipoSave = req.body.tipoSave;

    try {
        conn = await pool.getConnection();
        let str = ''
        const pool = db.pool;
        let conn;
        let data = []

      if (tipoSave === "bairro") {
        let bairro = req.body.bairro
        if(bairro){
            data = [
                bairro.nome || null,
                bairro.taxa || null,
            ]
            str = bairro.id 
            ? `update tbl_cad_loc_bairros set bai_desc=?, bai_taxa=? where bai_id = ${bairro.id}`
            : `insert into tbl_cad_loc_bairros (bai_desc, bai_taxa) values (?,?)`
            
            const r = await conn.query(str)
            bairro.id = r.insertId ?? bairro.id
            this.bairros = [...bairros.filter(e => e.id !== bairro.id), bairro]
            res.send(bairro)
        }
      } else if (tipoSave === 'endereco') {
        let endereco = req.body.endereco
        if(endereco){
            data = [
                endereco.bairro.id || null,
                endereco.cep || null,
                endereco.logradouro || null,
                endereco.complemento || null,
            ]
            str = bairro.id 
            ? `update tbl_cad_loc_end set bai_id=?,end_cep=?,end_log=?,end_comp=? where end_id = ${endereco.id}`
            : `insert into tbl_cad_loc_end (bai_id, end_cep, end_log, end_comp) values (?,?,?,?)`
            
            const r = await conn.query(str)
            endereco.id = r.insertId ?? endereco.id
            this.enderecos = [...this.enderecos.filter(e => e.id !== endereco.id), endereco]
            res.send(endereco)
        }
      }else if (tipoSave === 'local') {
        let endereco = req.body.endereco
        if(endereco){
            data = [
                endereco.cep || null,
                endereco.local || null,
                endereco.numero || null,
                endereco.referencia || null,
            ]
            str = bairro.id 
            ? `update tbl_cad_loc_pontos set end_cep=?, ponto_desc=?, ponto_n=?, ponto_ref=? where ponto_id = ${endereco.id}`
            : `insert into tbl_cad_loc_pontos (end_cep, ponto_desc, ponto_n, ponto_ref) values (?,?,?,?)`
            
            const r = await conn.query(str)
            endereco.id = r.insertId ?? endereco.id
            this.locais = [...this.locais.filter(e => e.id !== endereco.id), endereco]
            res.send(endereco)
        }
      }
    } catch (err) {
      console.error(err, err.stack);
    } finally {
      if (conn) return conn.end();
    }
  },
};
