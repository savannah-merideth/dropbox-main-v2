const AsyncLock = require('../helpers/async-lock');
const extractor = require('../extracts/item-extract');
const extractor2 = require('../extracts/item-extract2');
const SirvRun = require('./sirv-run');
const DropboxTextRun = require('./dropbox-text-run');
const ProcessDropbox = require('./process-dropbox');
const string_helper = require('../helpers/string-trim');
const dropbox = require('../apis/dropbox');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class ProcessWithQueue {

  constructor(dropbox_folder = '', name = '', list = [], number_process = 3) {
    this.number_process = number_process;
    this.dropbox_folder = dropbox_folder;
    this.list = list ? (Array.isArray(list) ? list : [list]) : [];
    this.name = name || 'ProcessWithQueue';

    this.sync_key = 'sync_key';
    this.sync_key_processed = 'sync_key_processed';
    this.count_process = 0;
    this.index = -1;
    this.lock_sync_key = new AsyncLock();
    this.lock_sync_key_processed = new AsyncLock();

    this.resolve = null;
  }

  increase_processed() {
    var t = this;
    return new Promise((resolve, reject) => {
      t.lock_sync_key_processed.acquire(t.sync_key_processed, function(done) {
        t.count_process += 1;
        // console.log('increase_processed', t.count_process)

        done(null);
      }, function(err, ret) {
        resolve();
      }, {});
    });
  }

  decrease_processed() {
    var t = this;
    return new Promise((resolve, reject) => {
      t.lock_sync_key_processed.acquire(t.sync_key_processed, function(done) {
        t.count_process -= 1;
        // console.log('decrease_processed', t.count_process)

        done(null);
      }, function(err, ret) {
        resolve();
      }, {});
    });
  }

  get_data() {
    var t = this;
    return new Promise((resolve, reject) => {
      t.lock_sync_key.acquire(t.sync_key, function(done) {
        // if (t.index + 1 >= 3) {
        //   console.log(`[${t.name}] test just 3 items`, t.index);
        //   return done();
        // }

        if (t.index + 1 >= t.list.length) {
          // console.log(`[${t.name}] No data at: ${(t.index + 1)}`);
          return done();
        }

        t.index += 1;
        // console.log(`[${t.name}] return data at: ${t.index}`);
        done(null, t.list[t.index]);

      }, function(err, ret) {
        resolve(ret);
      }, {});
    });
  }

  async wrap_process() {
    var t = this;
    var data = await t.get_data();
    if (data) {
      // console.log(`[${t.name}] wrap_process: ${data}`);
      await t.process_data(data);
    } else {
      // console.log('t.count_process', t.count_process)
      if (t.count_process <= 0) {
        console.log(`[${t.name}] End of list data`);
        if (typeof t.resolve === "function")
          t.resolve(1);
      }
    }
  }

  upload_images(dropbox_folder, list) {
    return new Promise((resolve, reject) => {
      var runner = new ProcessDropbox(dropbox_folder, null, list, 3);
      runner.start(resolve);
    })
  }

  async process_data(data) {
    var t = this;
    var item = null;
    await t.increase_processed();

    //test
    console.log('process_data', t.index, data);
    // await timeout(3000);
    // await t.decrease_processed();
    // return await t.wrap_process();

    try {
      if (data.toLowerCase().indexOf('asiansister.com') >= 0)
        item = await extractor.get_from_url(data);
      else
        item = await extractor2.get_from_url(data);
    } catch (err) {
      console.log('Error get item', err);
    }

    if (!item) {
      console.log('no data extracted', data);

      await t.decrease_processed();
      return await t.wrap_process();
    } else {
      // console.log('current item', item);
    }

    //upload dropbox
    var code = item.code + '_' + item.folder;
    var folder = `${string_helper.trimRight(t.dropbox_folder, '/')}/${code}`;

    //upload sirv
    var folder_sirv = '';
    if (data.toLowerCase().indexOf('asiansister.com') >= 0)
      folder_sirv = '/asiansister';
    else
      folder_sirv = '/asiantolick';

    var sirv_run = new SirvRun(folder_sirv, item);
    var file_info = await sirv_run.get_file();

    if (file_info && file_info.status === 'complete') {
      //check for total
      if (file_info.imgs && file_info.imgs.length > 0) {
        try {
          var item_in_folders = await dropbox.list_folder(`${folder}/images`);
          if (item_in_folders && item_in_folders.entries
            && item_in_folders.entries.length == file_info.imgs.length) {
            console.log('Already processed, no need !!!!!', data);

            await t.decrease_processed();
            return await t.wrap_process();
          }
        } catch (err) {
          console.log('Can not get entries for check', err);
        }
      }
    }

    var uploaded_file = await sirv_run.start(false);
    if (!uploaded_file) {
      console.log('can not upload to sirv.');

      await t.decrease_processed();
      return await t.wrap_process();
    }


    var uploaded_dropbox = await new DropboxTextRun(folder, item).start();
    if (uploaded_dropbox && item.imgs && item.imgs.length > 0) {
      //start upload images to dropbox
      await t.upload_images(`${folder}/images`, item.imgs);
      console.log('Done: ' + item.imgs.length);
    }

    var updated_status = await sirv_run.update_status(uploaded_file);
    console.log('updated_status', updated_status, data);

    await t.decrease_processed();
    return await t.wrap_process();
  }

  start(resolve) {
    var t = this;
    if (!t.list || t.list.length === 0) {
      console.log(`[${t.name}] No data to process.`);
      return resolve(1);
    }
    t.resolve = resolve;
    t.index = -1;

    for (var i = 0; i < t.number_process; i++) {
      timeout(i * 20).then(function() {
        t.wrap_process();
      });
    }
  }
}

module.exports = ProcessWithQueue
