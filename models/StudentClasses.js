var mongoose = require("mongoose");

var studentclasschema = new mongoose.Schema({
  classid: mongoose.Schema.Types.ObjectId,
  author: mongoose.Schema.Types.ObjectId,
});

module.exports = mongoose.model("StudentClasses", studentclasschema);
