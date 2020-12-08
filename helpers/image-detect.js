// var gif = Encoding.ASCII.GetBytes("GIF"); // GIF 
// var tiff = new byte[] { 73, 73, 42 }; // TIFF 
// var tiff2 = new byte[] { 77, 77, 42 }; // TIFF 

const number_to_check = 25;

// var png = new byte[] { 137, 80, 78, 71 }; // PNG 
function Is_png(chunk) {
  var ret = { pos: -1, result: false };
  if (!chunk)
    return ret;
  var n = number_to_check;
  if (n > chunk.length)
    n = chunk.length;
  var point_break = -1;
  for (var i = 0; i < n; i++) {
    if (chunk[i] === 137) {
      point_break = i;
      break;
    }
  }

  if (point_break !== -1 && point_break + 3 < chunk.length) {
    if (chunk[point_break + 1] === 80 &&
      chunk[point_break + 2] === 78 && chunk[point_break + 3] === 71)
      return { pos: point_break, result: true };
  }

  return ret;
}

// var bmp = Encoding.ASCII.GetBytes("BM");
// var bmp = new byte[] { 66, 77 }; // PNG 
function Is_bmp(chunk) {
  var ret = { pos: -1, result: false };
  if (!chunk)
    return ret;
  var n = number_to_check;
  if (n > chunk.length)
    n = chunk.length;
  var point_break = -1;
  for (var i = 0; i < n; i++) {
    if (chunk[i] === 66) {
      point_break = i;
      break;
    }
  }

  if (point_break !== -1 && point_break + 1 < chunk.length) {
    if (chunk[point_break + 1] === 77)
      return { pos: point_break, result: true };
  }

  return ret;
}

// var webp = Encoding.ASCII.GetBytes("RIFF");
// var webp = new byte[] { 82, 73, 70, 70 };
function Is_webp(chunk) {
  var ret = { pos: -1, result: false };
  if (!chunk)
    return ret;
  var n = number_to_check;
  if (n > chunk.length)
    n = chunk.length;
  var point_break = -1;
  for (var i = 0; i < n; i++) {
    if (chunk[i] === 82) {
      point_break = i;
      break;
    }
  }

  if (point_break !== -1 && point_break + 3 < chunk.length) {
    if (chunk[point_break + 1] === 73 &&
      chunk[point_break + 2] === 70 && chunk[point_break + 3] === 70)
      return { pos: point_break, result: true };
  }

  return ret;
}

// var jpeg = new byte[] { 255, 216, 255, 224 }; // jpeg 
// var jpeg2 = new byte[] { 255, 216, 255, 225 }; // jpeg canon
function Is_jpg(chunk) {
  var ret = { pos: -1, result: false };
  if (!chunk)
    return ret;
  var n = number_to_check;
  if (n > chunk.length)
    n = chunk.length;
  var point_break = -1;
  for (var i = 0; i < n; i++) {
    if (chunk[i] === 255) {
      point_break = i;
      break;
    }
  }

  if (point_break !== -1 && point_break + 3 < chunk.length) {
    if (chunk[point_break + 1] === 216 &&
      chunk[point_break + 2] === 255 &&
      (chunk[point_break + 3] === 224 || chunk[point_break + 3] === 225))
      return { pos: point_break, result: true };
  }

  return ret;
}

function Is_image(chunk) {
  var ret = null;

  ret = Is_png(chunk);
  if (ret.result)
    return ret;

  ret = Is_jpg(chunk);
  if (ret.result)
    return ret;

  ret = Is_bmp(chunk);
  if (ret.result)
    return ret;

  ret = Is_webp(chunk);
  if (ret.result)
    return ret;

  return { pos: -1, result: false };
}

module.exports.Is_jpg = Is_jpg;

module.exports.Is_png = Is_png;

module.exports.Is_bmp = Is_bmp;

module.exports.Is_webp = Is_webp;

module.exports.Is_image = Is_image;
