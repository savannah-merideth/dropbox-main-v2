var ProcessList = require("./managers/process-list");
const fs = require("fs");
const url_join = require("./helpers/url-join");
const path_file = "./main_log.txt";

class Main {
  constructor(folder, domain,
    page_index = 0,
    process_next_until_end = false,
    page_end_index = null
  ) {
    this.folder = folder;
    this.domain = domain;
    var indx = parseInt(page_index) || 0;
    if (domain.toLowerCase().indexOf('asiansister.com') >= 0) {
      if (indx < 1) indx = 1;
    } else {
      if (indx < 0) indx = 0;
    }
    this.page_index = indx;
    indx = parseInt(page_end_index) || 1;
    if (indx < 1) indx = 1;
    if (indx < this.page_index) indx = this.page_index + 1;
    this.page_end_index = indx;
    this.process_next_until_end = process_next_until_end || false;
  }

  add_log_end() {
    var date_done = new Date();
    fs.appendFileSync(
      path_file,
      `End page [${this.page_index}] at: [${new Date()}]\r\n`
    );
    console.log(`Done page ${this.page_index} at: ${date_done}`);
  }

  start() {
    var t = this;

    return new Promise(async (resolve, reject) => {
      var url = t.domain;
      if (url.toLowerCase().indexOf('asiansister.com') >= 0) {
        if (t.page_index > 1) {
          url += `_page${t.page_index}`;
        }
      } else {
        url = url_join(url, `ajax/buscar_posts.php?post=&cat=&tag=&search=&index=${t.page_index}`);
      }

      if (t.page_index > t.page_end_index) return resolve();
      console.log(`Process page: ${t.page_index}, domain: ${t.domain}, at: ${new Date()}`);

      fs.appendFileSync(
        path_file,
        `Start page [${t.page_index}] at: [${new Date()}]\r\n`
      );
      var p = new ProcessList(t.folder, url);
      try {
        var has_data = await p.start();
        if (has_data) {
          if (t.process_next_until_end) {
            t.add_log_end();
            t.page_index += 1;
            return resolve(await t.start());
          }
        }

        t.add_log_end();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = Main;
