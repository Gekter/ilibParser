const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const fs = require('fs');

async function getInfo(url) {
  const result = axios.get(url, {
      responseType: 'arraybuffer',
      responseEncoding: 'binary'  
  })
  .then(response => iconv.decode(Buffer.from(response.data), 'windows-1251'))
  .then(data => {
    const $ = cheerio.load(data, {decodeEntities: false})
    const author = $('.author').text()
    const bookName = $('h1').text()
    const matches = $('.tabout').text().match(/[0-9]{4}/)
    const date = matches ? matches[0] : 'Без даты'
    return {author: author, date: date, bookName: bookName, url: url}
  })
  .catch(err => {
    console.log(err)
  })
  return result
}



( async () => {
  
  let jsonForSave = {}
  let flag = true
  let count = 0
  const reqCount = 15

  do {  
    let promises = []
    for (let i = 0; i < reqCount; i++) {
      promises.push(getInfo('https://ilibrary.ru/text/'+ (i + 1 + count)))
    }
  
    let result = await Promise.all(promises)
    result.forEach(data => {
      if (data.bookName === '«»') {
        flag = false
      } else {
        if (jsonForSave[data.date]) {
          if (jsonForSave[data.date][data.author]) {
            jsonForSave[data.date][data.author].push({
              bookName: data.bookName,
              url: data.url
            })
          } else {
            jsonForSave[data.date][data.author] = [{
              bookName: data.bookName,
              url: data.url
            }]
          }
        } else {
          jsonForSave[data.date] = {}
          jsonForSave[data.date][data.author] = [{
            bookName: data.bookName,
            url: data.url
          }]
          
        }
      }
    });
    count += reqCount
    console.log(count)
    
  } while (flag)

  fs.writeFileSync('./public/result.json', JSON.stringify(jsonForSave), {
    encoding: 'utf8',
    flag: 'w'
  });
  
})()

