
const versioned = require('../apis/versioned');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class VersionedItem {
  constructor(item) {
    this.item = item;
  }

  async start() {
    var item = this.item;
    if (!item)
      return false;

    var result = null;
    // console.log(`[${t.name}] done: ${data}`, item);
    try {
      result = await versioned.create_item(item);
    } catch (ex) {
      console.log('Error create item', ex);
    }

    if (!result) {
      console.log('no result', item);
      return false;
    }

    if (result.statusText === 'Too Many Requests') {
      await timeout(1000);
      await versioned.create_item(item);
    }

    if (result.errors && result.errors.length > 0) {
      if (result.errors[0].message.indexOf('already exists (must be unique)') >= 0) {
        await timeout(500);
        var existed = await versioned.get_item_by_code(item);
        // console.log('existed', existed)
        if (!existed) {
          console.log('error get existed')
          return false;
        }

        await timeout(500);
        result = await versioned.update_item(existed.id, item);
        if (!result) {
          console.log('error updated', item);
          return false;
        }

        console.log('updated', result);
        console.log('---------------');
        return true;
      }
    }

    console.log('created', result);
    console.log('---------------');
    return true;
  }
}

module.exports = VersionedItem
