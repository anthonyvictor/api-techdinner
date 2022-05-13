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
    },

    formatDateIso(d){
        const worldDate = new Date(d);
        const time = worldDate.getTime()
        const tzo = worldDate.getTimezoneOffset()
        const min = 60
        const milli = min * 1000
        const stamp = time - (tzo * milli)
        const localDate = new Date(stamp)
        const localDateString = localDate
        .toISOString().replace(/T/, ' ').replace(/\..+/, '');
        return localDateString
      },
}