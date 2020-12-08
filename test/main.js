
const ProcessWithQueue = require('../managers/process-with-queue');

module.exports = function() {
  return new Promise(async (resolve, reject) => {
    /*
    var runner = new ProcessWithQueue('/Master/asiansister', null, ['https://asiansister.com/view_386____35Pn'], 8);
    runner.start(resolve);
    */

    
    var runner = new ProcessWithQueue('/Master/asiantolick', null, ['https://asiantolick.com/post-473/少女映画合集-very-cute-lolita-girl'], 8);
    runner.start(resolve);
    
  });
}