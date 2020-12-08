const axios = require('axios');
var qs = require('qs');
var url_join = require('../helpers/url-join');
var api_name = 'sirv';

const crypto = require('../helpers/crypto');
var domain = `https://${process.env.SIRV_CLIENT_CODE}.sirv.com`;

const instance = axios.create({
  baseURL: 'https://api.sirv.com/v2',
  timeout: 10000,
  headers: {
    'Accept': 'application/json'
  }
});

var get_token = function() {
  return new Promise(async (resolve, reject) => {
    var data = {
      clientId: process.env.SIRV_CLIENT_ID,
      clientSecret: process.env.SIRV_CLIENT_SECRET
    };

    instance.post('/token', data).then(res => {
      //console.log(res);
      resolve(res.data);
    }).catch(error => {
      reject(error);
    });
  });
}

var get_limit = function(token_str) {
  return new Promise(async (resolve, reject) => {
    if (!token_str)
      return reject('No token');

    instance.get('/account/limits', {
      headers: {
        authorization: 'Bearer ' + token_str
      }
    }).then(res => {
      //console.log(res);
      resolve(res.data);
    }).catch(error => {
      reject(error);
    });
  });
}

function check_exists(file_path, token_str) {
  return new Promise(async (resolve, reject) => {
    var file = await get_file_info(file_path, token_str);
    if (!file)
      return resolve(false);

    if (file.ctime)//"2020-07-17T13:31:39.347Z"
      resolve(true);
    else
      resolve(false);
  });
}

function create_file(file_path, content, token_str) {
  return new Promise((resolve, reject) => {
    if (!token_str || !file_path)
      return reject('No token or file');

    axios.post('https://api.sirv.com/v2/files/upload?filename=' + encodeURIComponent(file_path), Buffer.from(crypto.encrypt(content)), {
      headers: {
        authorization: 'Bearer ' + token_str
      }
    }).then(res => {
      // console.log('create_file', res.headers);
      resolve(res.status === 200 ? { ok: file_path } : null);
    }).catch(err => {
      var result = null;

      if (err.response && err.response.data) {
        result = err.response.data;
        console.log(`${api_name}: Error create file`, JSON.stringify(result, null, 2));
      }
      else if (err.response && err.response.status === 429) {
        result = { statusText: err.response.statusText };
        console.log(`${api_name}: Error create file`, result);
      }
      else {
        result = err.response ? err.response : err;
        console.log(`${api_name}: Error create file`, result);
      }

      resolve(result);
    });
  });
}

function get_file_info(file_path, token_str) {
  return new Promise((resolve, reject) => {

    if (!token_str || !file_path)
      return reject('No token or file');

    instance.get('/files/stat', {
      params: { filename: file_path },
      headers: {
        authorization: 'Bearer ' + token_str
      }
    }).then(res => {
      console.log('res.headers', res.headers);
      resolve(res.data);
    }).catch(err => {
      reject(err);
    });
  });
}

function decode_content(content) {
  if (!content)
    return '';

  try {
    var x = crypto.decrypt(Buffer.from(content).toString('utf-8'));
    return x;
  } catch (err) {
    return '';
  }
}

function get_file_content(file_path, token_str) {
  return new Promise(async (resolve, reject) => {
    if (!token_str || !file_path)
      return reject('No token or file', file_path);

    instance.get(url_join(domain, file_path)).then(res => {
      resolve(decode_content(res.data));
    }).catch(err => {
      reject(err);
    })
  });
}

function update_file(file_path, content, token_str) {
  return new Promise(async (resolve, reject) => {
    if (!token_str || !file_path)
      return reject('No token or file');

    axios.post('https://api.sirv.com/v2/files/upload?filename=' + encodeURIComponent(file_path), Buffer.from(crypto.encrypt(content)), {
      headers: {
        authorization: 'Bearer ' + token_str
      }
    }).then(res => {
      console.log('update_file', res.headers);
      resolve(res.status === 200 ? { ok: file_path } : null);
    }).catch(err => {
      var result = null;

      if (err.response && err.response.data) {
        result = err.response.data;
        console.log(`${api_name}: Error update file`, JSON.stringify(result, null, 2));
      }
      else if (err.response && err.response.status === 429) {
        result = { statusText: err.response.statusText };
        console.log(`${api_name}: Error update file`, result);
      }
      else {
        result = err.response ? err.response : err;
        console.log(`${api_name}: Error update file`, result);
      }

      resolve(result);
    });
  });
}

module.exports = {
  get_token,
  get_limit,
  check_exists,
  create_file,
  get_file_info,
  decode_content,
  get_file_content,
  update_file
}
