console.log("NEW FILE RUNNING");

const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("SERVER OK");
});

app.listen(10000, "0.0.0.0", () => {
  console.log("PORT 10000");
});
