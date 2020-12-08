
const detail = require('../extracts/item-extract2');
const list = require('../extracts/list-extract2');

module.exports = function() {
  return new Promise((resolve, reject) => {

    list.get_from_url('https://asiantolick.com/ajax/buscar_posts.php?post=&cat=&tag=&search=&index=0').then(res => {
      console.log(res.length);
      resolve(res);
    }).catch(err => {
      reject(err)
    });

  });
}