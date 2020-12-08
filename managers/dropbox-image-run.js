const dropbox = require('../apis/dropbox');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class DropboxRun {
  constructor(item, dropbox_path) {
    this.item = item;
    this.dropbox_path = dropbox_path;
  }

  async start() {
    console.log('DropboxRun', this.item.code);
    //test
    await timeout(3000);
    return true;

    var item = this.item;
    if (!item || !item.code) {
      console.log('No item or item not has code');
      return false;
    }

    if (!this.dropbox_path) {
      console.log('No dropbox_path to save');
      return false;
    }

    var str = JSON.stringify(item);
    try {
      var result = await dropbox.upload_from_string(str, this.dropbox_path, true)
        ;
      console.log('upload_from_string', result);
      if (result)
        return true;
    } catch (err) {
      console.log(err);
    }

    return false;
  }
}

module.exports = DropboxRun
