
const dropboxV2Api = require('dropbox-v2-api');
const fs = require('fs');
const through2 = require('through2');
const axios = require('axios');
var image_detect = require('../helpers/image-detect');
const crypto = require('../helpers/crypto');
const Readable = require('stream').Readable;


// create session ref:
const dropbox = dropboxV2Api.authenticate({
  token: process.env.DROPBOX_TOKEN
});


function make_id(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  if (length) length = parseInt(length);
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


var get_account_info = function() {
  return new Promise(async (resolve, reject) => {

    dropbox({
      resource: 'users/get_current_account',
      parameters: {

      }
    }, (err, result, response) => {
      if (err) { reject(err); }
      resolve(result);
    });

  });
}

const dropboxUploadStream = function(full_path, callback) {
  return dropbox({
    resource: 'files/upload',
    parameters: {
      path: full_path,
      mode: 'overwrite'
    }
  }, (err, result, response) => {
    //response.body == result;
    // console.log('done dropboxUploadStream', result);
    console.log('dropboxUploadStream', err, response.headers);
    if (typeof callback === 'function')
      callback(err, result);
  });
}

var upload_from_remote = function(url, dropbox_full_path, add_random_code = true) {
  return new Promise(async (resolve, reject) => {
    if (!url)
      return reject('Please provide remote url.');

    var response = null;
    try {
      response = await axios({
        url,
        method: 'GET',
        responseType: 'stream' // important
      });
    } catch (ex) {
      console.log('Error get remote url', ex);
      return reject(ex);
    }

    var flag = false;
    var modify_chunk = function(chunk, enc, callback) {
      // console.log('original chunk', chunk);
      if (flag === false) {
        flag = true;
        if (add_random_code) {
          var number_code = Math.floor(Math.random() * 10) + 10;
          chunk = Buffer.concat([Buffer.from(make_id(number_code)), chunk]);
        }
      }

      this.push(chunk);

      callback();
    }

    try {
      response.data
        .pipe(through2(modify_chunk))
        .pipe(dropboxUploadStream(dropbox_full_path, function(err1, result) {
          if (err1)
            reject(err1);
          else
            resolve(result);
        }));
    } catch (err) {
      reject(err);
    }
  });
}

var upload_from_local = function(file_path, dropbox_full_path, add_random_code = true) {
  return new Promise(async (resolve, reject) => {
    if (!file_path)
      throw new Error('Please provide local file path.');

    var flag = false;
    var modify_chunk = function(chunk, enc, callback) {
      // console.log('original chunk', chunk);
      if (flag === false) {
        flag = true;
        if (add_random_code) {
          var number_code = Math.floor(Math.random() * 10) + 10;
          chunk = Buffer.concat([Buffer.from(make_id(number_code)), chunk]);
        }
      }

      this.push(chunk);

      callback();
    }

    try {
      fs.createReadStream(file_path)
        .pipe(through2(modify_chunk))
        .pipe(dropboxUploadStream(dropbox_full_path, function(err1, result) {
          if (err1)
            reject(err1);
          else
            resolve(result);
        }));
    } catch (err) {
      reject(err);
    }
  });
}

var upload_from_string = function(content, dropbox_full_path, encrypt = true) {
  return new Promise(async (resolve, reject) => {
    if (!content)
      throw new Error('Please provide content.');

    var flag = false;
    var modify_chunk = function(chunk, enc, callback) {
      // console.log('original chunk', chunk);
      if (flag === false) {
        flag = true;
        if (encrypt)
          chunk = Buffer.from(crypto.encrypt(chunk.toString('utf-8')));
      }

      this.push(chunk);

      callback();
    }

    try {
      const ss = new Readable();
      ss.pipe(through2(modify_chunk))
        .pipe(dropboxUploadStream(dropbox_full_path, function(err1, result) {
          if (err1)
            reject(err1);
          else
            resolve(result);
        }))
        .on('finish', () => {
          console.log('done test ~');
        });

      ss.push(content);
      // indicates end-of-file basically - the end of the stream
      ss.push(null);

    } catch (err) {
      reject(err);
    }
  });
}

const dropboxDownloadStream = function(dropbox_full_path) {
  return dropbox({
    resource: 'files/download',
    parameters: { path: dropbox_full_path }
  });
}

function dropboxDownloadImageFile(dropbox_full_path) {
  var is_image = false;
  return dropboxDownloadStream(dropbox_full_path)
    .pipe(through2(function(chunk, enc, callback) {
      // console.log('chunk', chunk.length);
      if (is_image === false) {

        var ret = image_detect.Is_image(chunk);
        if (ret.result) {
          is_image = ret.result;
          chunk = chunk.slice(ret.pos);
        }

        // console.log('image_detect', is_image, chunk.length);
      }

      this.push(chunk);
      callback();
    }));
};

function dropboxDownloadTextFile(dropbox_full_path) {
  return dropboxDownloadStream(dropbox_full_path)
    .pipe(through2(function(chunk, enc, callback) {
      // console.log('chunk', chunk.length);
      chunk = Buffer.from(crypto.decrypt(chunk.toString('utf-8')));
      this.push(chunk);
      callback();
    }));
};

var get_file_meta = function(dropbox_full_path) {
  return new Promise(async (resolve, reject) => {
    dropbox({
      resource: 'files/get_metadata',
      parameters: {
        "path": dropbox_full_path,
        "include_media_info": false,
        "include_deleted": false,
        // "include_has_explicit_shared_members": false
      }
    }, (err, result, response) => {
      if (err) { reject(err); }
      resolve(result);
    });
  });
};

var check_file_exists = function(dropbox_full_path) {
  return new Promise(async (resolve, reject) => {
    try {
      var file_meta = await get_file_meta(dropbox_full_path);
      if (file_meta && !file_meta.error)
        resolve(true);
    } catch (err) {
      resolve(false);
    }
  });
};

var list_folder = function(dropbox_full_path, cursor = '') {
  return new Promise(async (resolve, reject) => {
    var parameters = {
      // "include_has_explicit_shared_members": false
    }

    if (cursor)
      parameters['cursor'] = cursor;
    else {
      parameters["path"] = dropbox_full_path;
      parameters["include_media_info"] = false;
      parameters["include_deleted"] = false;
    }

    dropbox({
      resource: `files/list_folder${cursor ? '/continue' : ''}`,
      parameters
    }, (err, result, response) => {
      if (err) { reject(err); }
      resolve(result);
    });
  });
};

module.exports = {
  get_account_info,
  upload_from_remote,
  upload_from_local,
  upload_from_string,
  check_file_exists,
  get_file_meta,
  list_folder,
  download_stream: dropboxDownloadStream,
  download_image_file: dropboxDownloadImageFile,
  download_text_file: dropboxDownloadTextFile
};
