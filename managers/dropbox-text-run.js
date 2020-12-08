const dropbox = require('../apis/dropbox');
const string_helper = require('../helpers/string-trim');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class DropboxTextRun {
  constructor(dropbox_folder, item) {
    this.item = item;
    this.dropbox_folder = dropbox_folder;
  }

  async start() {
    console.log('DropboxTextRun', this.item.code);
    //test
    // await timeout(3000);
    // return true;

    var item = this.item;
    if (!item || !item.code) {
      console.log('No item or item not has code');
      return false;
    }

    if (!this.dropbox_folder) {
      console.log('No dropbox_folder to save');
      return false;
    }

    var str = JSON.stringify(item);
    try {
      var full_path = `${string_helper.trimRight(this.dropbox_folder, '/')}/info.json`;

      var is_existed = await dropbox.check_file_exists(full_path);
      if (is_existed)
        return true;

      var result = await dropbox.upload_from_string(str, full_path, true)
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

module.exports = DropboxTextRun
