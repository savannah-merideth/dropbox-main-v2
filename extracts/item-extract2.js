const cheerio = require('cheerio');
const axios = require('axios');
const string_helper = require('../helpers/string-trim');
const name = '[detail:asiantolick.com]';
const url_join = require('../helpers/url-join');
const regex_id = /(^|\/)post-(?<id>\d+)\//;

function get_from_string(html, url_path = '', host = '') {
  return new Promise((resolve, reject) => {
    var result = {};

    if (!html)
      return resolve(result);

    if (host && host.indexOf('http') !== 0)
      host = 'https://' + host;

    const $ = cheerio.load(html);
    var h1 = $('h1');
    if (h1.length > 0) {
      result['name'] = h1.text().trim();

      var category = h1.parent().find('>span').last();

      if (category.length > 0) {
        result['category'] = category.text().replace('category:', '').trim();
        var tags = category.prev().find('> a');
        if (tags.length > 0) {
          var arrTags = [];
          tags.each((indx, el) => {
            arrTags.push($('h2', el).text().trim());
          });
          result['tags'] = arrTags;
        }
      }
    }

    const regex = /\/down\/(?<folder>\d+)\/thumb\//gm;
    if (url_path) {
      var matches = regex_id.exec(url_path);
      if (matches && matches.groups) {
        result['code'] = matches.groups['id'];
      }
    }
    if (!result.code && host) {
      var matches = regex_id.exec(host);
      if (matches && matches.groups) {
        result['code'] = matches.groups['id'];
      }
    }

    var imgs = $('#nanogallery2 > a');
    if (imgs.length > 0) {
      var arrSrcs = [];
      imgs.each((indx, el) => {
        var src = ($(el).attr('data-ngthumb') || '').trim();
        if (indx === 0) {
          var matches = regex.exec(src);
          if (matches && matches.groups) {
            result['folder'] = matches.groups['folder'];
          }
        }
        arrSrcs.push(($(el).attr('href') || '').trim());
      });
      result['imgs'] = arrSrcs;
    }

    result['url'] = decodeURIComponent(string_helper.trimLeft(url_path, '/'));
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
    var seg = url.split('/');
    if (seg.length > 0) {
      var encoded = encodeURIComponent(seg[seg.length - 1]);
      seg[seg.length - 1] = decodeURIComponent(seg[seg.length - 1]);
      var x = seg.join('/');
      if (x === url) {
        seg[seg.length - 1] = encoded;
        url = seg.join('/');
      }
    }

    axios.get(url, { responseType: 'text' })
      .then(async (res) => {
        var cc = res.request.res.connection;

        resolve(await get_from_string(res.data, res.request.path, `${cc.encrypted ? 'https://' : 'http://'}${cc._host}`));
      }).catch(err => {
        console.log(`${name}: Error get detail`, err);
        resolve(null);
      });
  });
}

module.exports = {
  get_from_string,
  get_from_url
}
