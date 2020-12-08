const express = require("express");
const router = express.Router();
const Main = require("../main");
const fs = require("fs");
const path = require("path");
const path_file = "main_log.txt";

router.get("/", (req, res, next) => {
  res.json({ msg: "Hello world" });
});

router.get("/log", (req, res, next) => {
  res.set("x-file", path_file);
  // res.type(path.extname(path_file));
  //createReadStream
  res.sendFile(path.join(__dirname, "../" + path_file));
});

router.post("/process", (req, res, next) => {
  if (req.body.pass === process.env.SECRET_CODE) {
    console.log("req.body", req.body);
    var { folder, domain, page, process_next_until_end, page_end_index } = req.body;

    if (!folder || !domain)
      return res
        .status(500)
        .json({ err: "Please provide [folder] and [domain]." });


    if (domain.toLowerCase().indexOf('asiansister.com') >= 0 && !page)
      return res
        .status(500)
        .json({ err: "Please provide [page] and [process_next_until_end]." });

    if (domain.toLowerCase().indexOf('asiansister.com') >= 0)
      page = page || 1;
    else
      page = page || 0;

    page_end_index = page_end_index || (page + 1);
    process_next_until_end = process_next_until_end ? true : false;
    new Main(folder, domain, page, process_next_until_end, page_end_index).start();

    return res.json({
      msg: `Server processing: ${page} - ${page_end_index} with option [process_next_until_end]: ${process_next_until_end}`
    });
  }

  res.status(500).json({ err: "Invalid password." });
});

// export the router so we can pass the routes to our server
module.exports = router;
