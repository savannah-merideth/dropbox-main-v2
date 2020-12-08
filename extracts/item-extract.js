const cheerio = require('cheerio');
const axios = require('axios');
const string_helper = require('../helpers/string-trim');

function get_from_string(html, url_path = '', host = '') {
  return new Promise((resolve, reject) => {
    var result = {};

    const $ = cheerio.load(html);
    var h1 = $('h1');
    if (h1.length > 0)
      result['name'] = h1.text();

    var category = $('div.headTitle > a');
    if (category.length > 0)
      result['category'] = category.text();

    var tags = $('#detailBox > a');
    if (tags.length > 0) {
      var arrTags = [];
      tags.each((indx, el) => {
        arrTags.push($(el).text());
      });
      result['tags'] = arrTags;
    }

    const regex = /images\/items\/(?<folder>\d+)?\/(?<id>\d+)_/gm;

    var imgs = $('.showMiniImage');
    if (imgs.length > 0) {
      var arrSrcs = [];
      imgs.each((indx, el) => {
        var src = $(el).attr('dataurl').replace('imageimages/', 'images/');
        if (indx === 0) {
          var matches = regex.exec(src);
          if (matches && matches.groups) {
            result['folder'] = matches.groups['folder'] || '';
            result['code'] = matches.groups['id'];
          }
        }
        arrSrcs.push(`${host}/${src.replace(/\/\//g, '/')}`);
      });
      result['imgs'] = arrSrcs;
    }

    result['url'] = url_path;
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

          resolve(await get_from_string(res.data, string_helper.trimLeft(res.request.path, '/'), `${cc.encrypted ? 'https://' : 'http://'}${cc._host}`));
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
