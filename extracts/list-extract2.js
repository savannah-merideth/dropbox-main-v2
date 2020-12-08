const cheerio = require('cheerio');
const axios = require('axios');
const name = '[list:asiantolick.com]';
const url_join = require('../helpers/url-join');
const path = require('path');
const string_helper = require('../helpers/string-trim');

function get_from_string(html, host = '') {
  return new Promise((resolve, reject) => {
    var result = [];

    if (!html)
      return resolve(result);

    if (host && host.indexOf('http') !== 0)
      host = 'https://' + host;

    const $ = cheerio.load('<div id="xxxx">' + html + '</div>');
    var items = $('#xxxx > a');

    if (items.length > 0) {
      items.each((indx, elem) => {
        // var name_el = $('.titulo_video', elem);
        var link = $(elem).attr('href');
        // var thumb = $('img', elem).attr('data-src') || '';
        result.push(link);
      });
    }

    resolve(result);
  });
}

function get_from_url(url) {
  return new Promise(async (resolve, reject) => {
    if (!url)
      resolve(null);

    if (url.length > 255 || url.toLowerCase().indexOf('>') >= 0)
      resolve(await get_from_string(url));

    if (url.indexOf('http') !== 0)
      url = 'https://' + url;

    axios.get(url, { responseType: 'arraybuffer', reponseEncoding: 'binary' })
      .then(async(res) => {
        var cc = res.request.res.connection;
        var result = await get_from_string(res.data.toString('utf-8'), `${cc.encrypted ? 'https://' : 'http://'}${cc._host}`);
        resolve(result);
      }).catch(err => {
        console.log(`${name}: Error get list`, err);
        resolve(null);
      });
  });
}

module.exports = {
  get_from_string,
  get_from_url
}
