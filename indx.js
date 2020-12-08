const createError = require("http-errors");
const express = require("express");
const path = require("path");
var debug = require("debug")("dropbox-main:server");

const main = require("./routes/index");

const app = express();

// view engine setup

// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//for all route
app.use((req, res, next) => {
  var is_json = req.is("application/json");
  if (!is_json) {
    var contype = req.headers["content-type"];
    if (contype && contype.indexOf("application/json") !== -1) is_json = true;
  }
  app.locals.url = req.originalUrl;
  req.is_json = is_json;
  next();
});

app.use("/", main);

// catch 404 Not found middleware
app.use((req, res, next) => {
  console.log("Not found", req.url);
  const err = new Error(`The page requested does not exist.`);
  res.status(404).json({ "page-not-found": err });
});

//Global error middleware handler
app.use(function(err, req, res, next) {
  // console.log("Global error", req.is_json, err);
  res.status(err.status || 500).json({ err: err.message });
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

var port = normalizePort(process.env.PORT || "8080");
//var port = normalizePort('8080');
app.set("port", port);

/**
 * Create HTTP server.
 */

var http = require("http");

module.exports = function() {

  var server = http.createServer(app);

  /**
   * Event listener for HTTP server "error" event.
   */

  function onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
    debug("Listening on " + bind);
  }

  server.on("error", onError);
  server.on("listening", onListening);

  server.listen(port);

}
