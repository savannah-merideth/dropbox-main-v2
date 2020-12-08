const extractor = require('../extracts/list-extract');
const extractor2 = require('../extracts/list-extract2');
const ProcessWithQueue = require('./process-with-queue');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class ProcessList {

  constructor(dropbox_folder = '', list_url = '') {
    this.list_url = list_url;
    this.dropbox_folder = dropbox_folder;
  }

  start() {
    var t = this;
    return new Promise(async (resolve, reject) => {

      var list = [];
      try {
        if (t.list_url.toLowerCase().indexOf('asiansister.com') >= 0)
          list = await extractor.get_from_url(t.list_url);
        else
          list = await extractor2.get_from_url(t.list_url);
      } catch (err) {
        console.log('Error get list item', err);
        reject(err);
      }

      if (!list || list.length === 0) {
        console.log(`No data to process.`);
        return resolve(0);
      }
      console.log(`list: ${list.length}`);

      var runner = new ProcessWithQueue(t.dropbox_folder, null, list, 3);
      runner.start(resolve);
    });
  }
}

module.exports = ProcessList
