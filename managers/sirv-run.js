const sirv = require('../apis/sirv');
const string_helper = require('../helpers/string-trim');
const path = require('path');
const fs = require('fs');
const temp_token = './sirv-token.txt';

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class SirvRun {
  constructor(folder, item) {
    this.folder = folder;
    this.item = item;
    this.token = '';
  }

  async start(check_exists = true) {
    var t = this;
    var item = t.item;

    if (!item)
      return;

    if (!t.token)
      await t.refresh_token();

    if (!t.token)
      return;

    console.log('SirvRun', item.code);
    //test
    // await timeout(3000);
    // return true;

    var result = null;
    var file_path = t.get_file_name(item);
    if (!file_path)
      return null;

    if (check_exists) {
      try {
        var file = await t.get_file();
        if (file)
          return file;
      } catch (ex) {
        console.log('Error get item', ex);
      }
    }

    async function create_file() {
      try {
        item.status = 'pending';
        result = await sirv.create_file(file_path, JSON.stringify(item), t.token);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          await t.refresh_token();
          if (t.token)
            result = await sirv.create_file(file_path, JSON.stringify(item), t.token);
        } else
          console.log('Error create item', err);
      }
    }

    await create_file();

    if (!result) {
      console.log('no result', item);
      return false;
    }

    if (result.statusText === 'Too Many Requests') {
      await timeout(1000);
      await create_file();
    }

    if (result && result.ok)
      result = item;
    // console.log('created', result);
    console.log('---------------');
    return result;
  }

  get_file_name(item) {
    if (!item || !item.code)
      return '';
    var str = item.code;
    if (item.folder)
      str += '_' + item.folder;

    var result = null;
    return `/${string_helper.trim(this.folder, '/')}/${str}.json`;
  }

  async refresh_token() {
    var t = this;
    t.token = '';
    try {
      var content = await fs.readFileSync(temp_token);
      if (content) {
        t.token = content;
        try {
          var limits = await sirv.get_limit(content);
          if (limits)
            return;
        } catch (ex) {
          if (ex.response && ex.response.status === 401) {
            t.token = '';
          }
        }
      }

      var token = await sirv.get_token();
      // console.log('token', token);
      t.token = token && token.token;
      await fs.writeFileSync(temp_token, t.token);
    } catch (err) {
      console.log('Error refresh token', err);
    }
  }

  async get_file() {
    // console.log('xxxxSirvRun', this.item);

    var file_path = this.get_file_name(this.item);
    if (!file_path)
      return null;

    if (!this.token)
      await this.refresh_token();

    try {
      var str = await sirv.get_file_content(file_path, this.token);
      if (str)
        return (typeof str === 'string' ? JSON.parse(str) : str);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await this.refresh_token();
        if (this.token)
          return this.get_file();
      } else
        console.log('Error get item', file_path);
    }

    return null;
  }

  async update_status(item) {
    // console.log('item', item);
    if (!item)
      return false;

    if (typeof item === 'string') {
      //decode
      try {
        item = JSON.parse(sirv.decode_content(item));
      } catch (err) {
        item = null;
      }
    }

    var result = null;
    var file_path = this.get_file_name(item);
    if (!file_path)
      return false;

    try {
      item.status = 'complete';
      var file = await sirv.update_file(file_path, JSON.stringify(item), this.token);
      if (file)
        return true;
    } catch (ex) {
      console.log('Error update item status', ex);
    }

    return false;
  }
}

module.exports = SirvRun
