
const detail = require('../extracts/item-extract');
const list = require('../extracts/list-extract');

module.exports = function() {
  return new Promise((resolve, reject) => {

    detail.get_from_url('https://asiantolick.com/post-522/no.2521-rosi%E5%AF%AB%E7%9C%9F-rosi%E5%86%99%E7%9C%9F-lolita-girl-in-cute-blue-dress.').then(res => {
      resolve(res);
    }).catch(err => {
      reject(err)
    })

  });
}