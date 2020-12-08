const AsyncLock = require('../helpers/async-lock');
const dropbox = require('../apis/dropbox');
const path = require('path');
const string_helper = require('../helpers/string-trim');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const regex_name = /\d+_(?<name>\d+)_[^\.].*.(?<ext>jpg|png|bmp)$/gmi;

class ProcessDropbox {

  constructor(dropbox_folder = '', name = '', list = [], number_process = 3) {
    this.number_process = number_process;
    this.dropbox_folder = dropbox_folder;
    console.log('dropbox_folder', dropbox_folder)
    this.list = list ? (Array.isArray(list) ? list : [list]) : [];
    this.name = name || 'ProcessDropbox';

    this.sync_key = 'sync_key2';
    this.sync_key_processed = 'sync_key_processed2';
    this.count_process = 0;
    this.index = -1;
    this.lock_sync_key = new AsyncLock();
    this.lock_sync_key_processed = new AsyncLock();

    this.resolve = null;
    this.processed = [];
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

  get_name(data) {
    if (data.match(regex_name)) {
      var matches = regex_name.exec(data);
      if (matches)
        return `${matches.groups['name']}.${matches.groups['ext']}`;
    }
    return data;
  }

  async process_data(data) {
    var t = this;
    var item = null;
    await t.increase_processed();

    //test
    // console.log('process_data', t.index, data);
    // await timeout(3000);
    // await t.decrease_processed();
    // return await t.wrap_process();


    var full_path = `${string_helper.trimRight(t.dropbox_folder, '/')}/${t.get_name(path.basename(data))}`;
    // console.log('full_path', full_path);
    var is_existed = t.check_processed(full_path);
    if (is_existed == false)
      is_existed = await dropbox.check_file_exists(full_path);

    if (is_existed) {
      console.log('already processed [' + full_path + ']... skipping.');
      await t.decrease_processed();
      return await t.wrap_process();
    }

    try {
      var result = await dropbox.upload_from_remote(data, full_path, true);
      // console.log('result', result);
    } catch (err) {
      console.log('Error upload dropbox', err.response);
      if (err.response && err.response.headers) {
        var x = err.response.headers['Retry-After'];
        if (x) {
          var time_again = parseInt(x) || 0;
          await timeout(time_again * 1000);
          return await t.process_data(data);
        }
      }
    }

    await t.decrease_processed();
    return await t.wrap_process();
  }

  check_processed(path_lower) {
    var result = this.processed.find((item) => {
      return item.path_lower == path_lower;
    });
    return result ? true : false;
  }

  async load_existed() {
    try {
      var lst = await dropbox.list_folder(this.dropbox_folder, '');
      if (lst && lst.entries)
        this.processed = lst.entries || [];
      console.log('load_existed: ' + this.processed);
    } catch (ex) {
      console.log('Error load existed', ex);
    }
  }

  start(resolve) {
    var t = this;
    if (!t.list || t.list.length === 0) {
      console.log(`[${t.name}] No data to process.`);
      return resolve(1);
    }

    t.resolve = resolve;
    t.index = -1;
    t.load_existed().then(() => {
      console.log('[ProcessDropbox] total files: ' + t.list.length);
      for (var i = 0; i < t.number_process; i++) {
        timeout(i * 20).then(function() {
          t.wrap_process();
        });
      }
    });
  }
}

module.exports = ProcessDropbox
