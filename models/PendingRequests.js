const { ObjectId } = require("bson");
var mongoose = require("mongoose");

var pendingrequestsschema = new mongoose.Schema({
  name: String,
  rollnumber: String,
  certificate: String,
  requestFromStudent: mongoose.Schema.Types.ObjectId,
  requestForClass: mongoose.Schema.Types.ObjectId,
});

module.exports = mongoose.model("PendingRequests", pendingrequestsschema);
