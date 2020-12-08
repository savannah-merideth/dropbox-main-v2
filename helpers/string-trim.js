
var trim = function(str,charlist) {
  str = trimLeft(str,charlist);
  return trimRight(str,charlist);
};

var trimLeft = function(str, charlist) {
  if (charlist === undefined)
    charlist = "\s";

  return str.replace(new RegExp("^[" + charlist + "]+"), "");
};
var trimRight = function(str,charlist) {
  if (charlist === undefined)
    charlist = "\s";

  return str.replace(new RegExp("[" + charlist + "]+$"), "");
};

module.exports = {
  trim, trimLeft, trimRight
}