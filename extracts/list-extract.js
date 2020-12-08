const cheerio = require('cheerio');
const axios = require('axios');

function get_from_string(html, host = '') {
  return new Promise((resolve, reject) => {
    var result = [];

    const $ = cheerio.load(html);
    var items = $('center > .itemBox > a');
    if (items.length > 0) {
      items.each((indx, elem) => {
        result.push(host + '/' + $(elem).attr('href'));
      });
    }

    resolve(result);
  });
}

function get_from_url(url) {
  return new Promise(async (resolve, reject) => {
    if (!url)
      resolve(null);

    if (url.toLowerCase().indexOf('http') !== 0)
      resolve(await get_from_string(url));
    else {
      axios.get(url, { responseType: 'text' })
        .then(async (res) => {
          var cc = res.request.res.connection;
          resolve(await get_from_string(res.data, `${cc.encrypted ? 'https://' : 'http://'}${cc._host}`));
        }).catch(err => {
          console.log('Error get', err);
          resolve(null);
        });
    }
  });
}

module.exports = {
  get_from_string,
  get_from_url
}
