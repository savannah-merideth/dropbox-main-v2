
const dropbox = require('../apis/dropbox');

module.exports = function() {
  return new Promise(async (resolve, reject) => {
    dropbox.list_folder('/master').then(res => {
      console.log(res);
      resolve();
    }).catch(err=>{
      console.log(err);
      resolve()
    });
  });
}