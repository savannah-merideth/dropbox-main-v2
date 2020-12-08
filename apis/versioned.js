const axios = require('axios');
var qs = require('qs');
var spaceId = process.env.versioned_spaceId;
var api_name = 'versioned';

const instance = axios.create({
  baseURL: 'https://api.versioned.io/v1',
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${process.env.versioned_token}`,
    'Accept': 'application/json'
  }
});

async function GetItems(keyword, exactEqual) {
  var fieldExactEqual = null;
  if (keyword) {
    if (exactEqual) {
      fieldExactEqual = {
        "code[eq]": keyword
      };
    } else {
      fieldExactEqual = {
        "code[regex]": keyword
      };
    }
  }

  return GetContents('item', keyword, fieldExactEqual);
}

async function GetItemByCode(code) {
  var str = code || ''
  if (!str)
    return null;
  if (typeof str === 'object')
    str = str.code + '_' + str.folder;
  var results = [];
  try {
    results = await GetItems(str, true);
  } catch (err) {

  }

  if (results && results.data && results.data.length > 0)
    return results.data[0];
  else
    return null;
}

async function GetFirstTempItem() {
  return GetFirstTempContent('item', { "code[regex]": '000' });
}

async function GetContents(type, keyword, fieldExactEqual) {
  var results = [];
  var params = {
    "limit": "50", "skip": "0"
  };

  if (fieldExactEqual && Object.keys(fieldExactEqual).length > 0) {
    for (var key in fieldExactEqual) {
      params["filter." + key] = fieldExactEqual[key];
    }
  }
  else if (keyword)
    params['q'] = keyword;

  // console.log(JSON.stringify(params, null, 2));

  try {

    x = await instance.get(`/data/${spaceId}/${type}?${qs.stringify(params)}`);

    results = x.data;
  } catch (err) {
    if (err.response && err.response.data) {
      console.log(`${api_name}: Error get all contents`, JSON.stringify(err.response.data, null, 2));
    }
    else if (err.response && err.response.status === 429) {
      results = [{ statusText: err.response.statusText }];
    }
    else {
      console.log(`${api_name}: Error get all contents`, err.response ? err.response : err);
    }
  }

  // console.log(JSON.stringify(results, null, 2));

  return results;
}

async function GetFirstTempContent(type, fieldExactEqual) {
  var results = [];
  var params = {
    "limit": "1", "skip": "0"
  };

  for (var key in fieldExactEqual) {
    params["filter." + key] = fieldExactEqual[key];
  }

  // console.log(JSON.stringify(params, null, 2));

  try {

    x = await instance.get(`/data/${spaceId}/${type}?${qs.stringify(params)}`);

    results = x.data;
  } catch (err) {
    console.log(`${api_name}: Error get temp contents`, err);
  }

  // console.log(JSON.stringify(results, null, 2));

  if (results && results.data) {
    return results.data[0];
  }

  return null;
}

async function GetContentByIds(type, ids) {
  if (!ids || ids.length === 0)
    return [];
  if (typeof ids === 'string')
    ids = [ids];

  var results = [];
  var params = {
    'filter.id[in]': ids.join(',')
  };

  // console.log(JSON.stringify(params, null, 2));

  try {
    x = await instance.get(`/data/${spaceId}/${type}?${qs.stringify(params)}`);
    results = x.data;
  } catch (err) {
    console.log(`${api_name}: Error get content by ids`, err);
  }

  //console.log(JSON.stringify(results, null, 2));

  return results;
}

async function CreateContent(type, data) {
  var result = null;

  try {
    x = await instance.post(`/data/${spaceId}/${type}`, data);
    result = x.data && x.data.data;
  } catch (err) {
    if (err.response && err.response.data) {
      result = err.response.data;
      // console.log(`${api_name}: Error create content`, JSON.stringify(result, null, 2));
    }
    else if (err.response && err.response.status === 429) {
      result = { statusText: err.response.statusText };
    }
    else {
      result = err.response ? err.response : err;
      // console.log(`${api_name}: Error create content`, result);
    }
  }

  // console.log(JSON.stringify(result, null, 2));

  return result;
}

async function UpdateContent(type, id, data) {
  if (!id) {
    console.log('Please provide id to update.');
    return null;
  }

  var result = null;

  try {
    x = await instance.put(`/data/${spaceId}/${type}/${id}`, data);
    result = x.data;
    // console.log('UpdateContent', x.data, x.status);
    if (!result && x.status === 204)
      result = data;
  } catch (err) {
    if (err.response && err.response.data)
      console.log(`${api_name}: Error update content`, JSON.stringify(err.response.data, null, 2));
    else if (err.response && err.response.status === 429) {
      console.log(`${api_name}: ${err.response.statusText}`);
    }
    else
      console.log(`${api_name}: Error update content`, err.response ? err.response : err);
  }

  // console.log('UpdateContent', JSON.stringify(result, null, 2));

  return result;
}

async function CreateItem(data) {
  // console.log('data', data);
  var code = typeof data === 'string' ? data : (data.code || '');
  var folder = typeof data === 'string' ? '' : (data.folder || '');
  var url = typeof data === 'string' ? '' : (data.url || '');
  if (!code) {
    console.log('Please provide code.');
    return null;
  }

  if (!url) {
    console.log('Please provide url.');
    return null;
  }

  code += '_' + folder;

  var obj = {
    "state": typeof data === 'string' ? data : ('pending'),
    url, code
  };

  return await CreateContent('item', obj);
}

async function UpdateItem(id, data) {
  if (!id) {
    console.log('Please provide id to update.');
    return null;
  }

  var code = typeof data === 'string' ? data : (data.code || '');
  var folder = typeof data === 'string' ? '' : (data.folder || '');
  var url = typeof data === 'string' ? '' : (data.url || '');
  if (!code) {
    console.log('Please provide code.');
    return null;
  }

  if (!url) {
    console.log('Please provide url.');
    return null;
  }

  code += '_' + folder;

  var obj = {
    "state": typeof data === 'string' ? data : ('pending'),
    url, code
  };

  return await UpdateContent('item', id, obj);
}


async function GetItemsByIds(ids) {
  return await GetContentByIds('item', ids);
}

module.exports = {

  get_by_ids: GetContentByIds,

  list: GetContents,

  get_items: GetItems,

  get_items_by_ids: GetItemsByIds,

  get_item_by_code: GetItemByCode,

  create_item: CreateItem,

  update_item: UpdateItem,

  get_first_temp_item: GetFirstTempItem,

  name: api_name
}
