//ROTAS DESATIVADAS (ATIVAR SOMENTE HAVENDO NECESSIDADE)

// BAIXAR AS IMAGENS DO BANCO DE DADOS
router.get('/download/*', 
async (req, res) => {
    const urls = req.url.substring(req.url.lastIndexOf('/') + 1)
    const url = urls.substring(0, urls.length - 1)

    const tabela = 
    urls === 'bebidas' ? 'tbl_cad_bb' : 
    urls === 'outros' ? 'tbl_cad_outros' : 
    urls === 'clientes' ? 'tbl_cad_cli' : 
    null

    if(!tabela) {
        res.send('não concluido')
        return
    }

    const imgs = await misc.getImagesFromBD(
        `${url}_id`, 
        `${url}_img`, 
        tabela
    )

    misc.downloadImages(urls, imgs)
    res.send('baixado')
})