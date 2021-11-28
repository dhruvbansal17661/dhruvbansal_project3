var mongoose = require("mongoose");

var teacherclasschema = new mongoose.Schema({
  topic: String,
  date: String,
  time: String,
  strength_allowed: String,
  vaccination_required: String,
  message: String,
  author: mongoose.Schema.Types.ObjectId,
});

module.exports = mongoose.model("TeacherClasses", teacherclasschema);
