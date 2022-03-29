module.exports = {
    base64ToBlob(str){
        if(!str || str.length === 0) return null
        console.log('base64: ',str)
        const byteArray = new Buffer.from(str.replace(/^[\w\d;:\/]+base64\,/g, ''), 'base64');
        console.log('blob: ', byteArray)
        return byteArray
    }, 
    async blobStringToBlob(blobUrl){
        const blob = await fetch(blobUrl).then(res => res.blob())
        return blob
    }
}