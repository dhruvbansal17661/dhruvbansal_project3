var express = require("express");
var app = express();
var request = require("request");
var mongoose = require("mongoose");

var flash = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var bodyParser = require("body-parser");

var TeacherClasses = require("./models/TeacherClasses");
var StudentClasses = require("./models/StudentClasses");
var PendingRequest = require("./models/PendingRequests");
var User = require("./models/user");
const user = require("./models/user");

// const PendingRequests = require("./models/PendingRequests");

mongoose.connect(
  "mongodb+srv://dhruvbansal:9410529104@cluster0.talvz.mongodb.net/Cluster0?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

// Command to start the mongodb server : sudo systemctl start mongod
// mongodb+srv://dhruvbansal:9410529104@cluster0.talvz.mongodb.net/Cluster0?retryWrites=true&w=majority
// mongodb://localhost/scheduler

app.use(
  require("express-session")({
    secret: "This is the secret key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

console.log("Working");
app.set("view engine", "ejs");

// Login page route

app.get("/", function (req, res) {
  res.render("login.ejs");
});

// app.post("/", function (req, res) {
//   console.log(req.body);
// });

app.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/accountdecider",
    failureRedirect: "/",
  }),
  function (req, res) {
    console.log("here2");
    // console.log(req.body);
  }
);

app.get("/accountdecider", function (req, res) {
  if (req.user.type == "teacher") {
    res.redirect("/teacher");
  } else if (req.user.type == "student") {
    res.redirect("student");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  // req.flash("success", "Logged you out!");
  res.redirect("/");
});

// Register page route

app.get("/register", function (req, res) {
  res.render("register.ejs");
});

app.post("/register", function (req, res) {
  console.log(req.body);
  var newUser = new User({ username: req.body.username, type: req.body.type });
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      return res.render("register.ejs");
    }

    passport.authenticate("local")(req, res, function () {
      if (req.body.type == "teacher") {
        res.redirect("/teacher");
      } else if (req.body.type == "student") {
        res.redirect("/student");
      }
    });

    // res.redirect('/login');
  });
});

// Teacher Routes

app.get("/teacher", isLoggedIn, function (req, res) {
  TeacherClasses.find({}, function (err, allClasses) {
    var curr_user_classes = [];

    allClasses.forEach(function (current_class) {
      // console.log(current_class);
      // console.log(req.user);
      if (current_class.author.toString() == req.user._id.toString()) {
        curr_user_classes.push(current_class);
      }
    });

    if (err) {
      console.log(err);
    } else {
      PendingRequest.find({}, function (err, allRequests) {
        if (err) {
          console.log(err);
        } else {
          curr_user_requests = [];

          TeacherClasses.find({}, function (err, foundAllClasses) {
            if (err) {
              console.log(err);
            } else {
              allRequests.forEach(function (curr_req) {
                foundAllClasses.forEach(function (foundAllClass) {
                  if (
                    curr_req.requestForClass.toString() ==
                    foundAllClass._id.toString()
                  ) {
                    if (
                      foundAllClass.author.toString() == req.user._id.toString()
                    ) {
                      curr_user_requests.push(curr_req);
                    }
                  }
                });
              });

              res.render("teacher/index.ejs", {
                meetings: curr_user_classes,
                pending_requests: curr_user_requests,
                username: req.user.username,
              });
            }
          });
        }

        // allRequests.forEach(function (curr_req) {
        //   // console.log(curr_req);

        //   // TeacherClasses.findById(
        //   //   curr_req.requestForClass.toString(),
        //   //   function (err, foundClassHere) {
        //   //     if (err) {
        //   //       console.log(err);
        //   //     } else {
        //   //       if (
        //   //         foundClassHere.author.toString() == req.user.id.toString()
        //   //       ) {
        //   //         curr_user_requests.push(curr_req);
        //   //       }
        //   //     }
        //   //   }
        //   // );

        // });
      });
    }
  });
});

app.post("/teacher", isLoggedIn, function (req, res) {
  console.log(req.user);

  var new_meeting = {
    topic: req.body.topic,
    date: req.body.date,
    time: req.body.time,
    strength_allowed: req.body.strength_allowed,
    vaccination_required: req.body.vaccination_required,
    message: req.body.message,
    author: req.user._id,
  };

  // teacher_meetings.push(new_meeting);

  TeacherClasses.create(new_meeting, function (err, createdClass) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/teacher");
    }
  });
});

app.get("/teacher/createnewclass", isLoggedIn, function (req, res) {
  res.render("teacher/newClassForm.ejs", { username: req.user.username });
});

app.post("/teacher/:id", function (req, res) {
  TeacherClasses.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/teacher");
    }
  });
});

// Pending Requests routes

app.get("/teacher/requests/:id", isLoggedIn, function (req, res) {
  PendingRequest.findById(req.params.id, function (err, foundRequest) {
    if (err) {
      console.log(err);
    } else {
      res.render("teacher/PendingRequests/request.ejs", {
        request: foundRequest,
        username: req.user.username,
      });
    }
  });
});

app.post("/teacher/requests/accept", isLoggedIn, function (req, res) {
  PendingRequest.findById(req.body.requestId, function (err, foundRequest) {
    console.log("foundRequest");
    console.log(foundRequest);
    if (err) {
      console.log(err);
    } else {
      TeacherClasses.findById(
        foundRequest.requestForClass.toString(),
        function (err, foundTeacherClass) {
          console.log(foundTeacherClass);
          var new_student_class = {
            topic: foundTeacherClass.topic,
            date: foundTeacherClass.date,
            time: foundTeacherClass.time,
            strength_allowed: foundTeacherClass.strength_allowed,
            vaccination_required: foundTeacherClass.vaccination_required,
            message: foundTeacherClass.message,
            author: foundRequest.requestFromStudent,
          };
          StudentClasses.create(
            new_student_class,
            function (err, createdStudentClass) {
              if (err) {
                console.log(err);
              } else {
                PendingRequest.findByIdAndRemove(
                  req.body.requestId,
                  function (err) {
                    if (err) {
                      console.log(err);
                    } else {
                      res.redirect("/teacher");
                    }
                  }
                );
              }
            }
          );
        }
      );
    }
  });
});

app.post("/teacher/requests/reject", isLoggedIn, function (req, res) {
  PendingRequest.findByIdAndRemove(req.body.requestId, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/teacher");
    }
  });
});

// Student Routes

app.get("/student", isLoggedIn, function (req, res) {
  StudentClasses.find({}, function (err, allClasses) {
    curr_student_classes = [];

    allClasses.forEach(function (curr_student_class) {
      if (curr_student_class.author.toString() == req.user._id.toString()) {
        curr_student_classes.push(curr_student_class);
      }
    });

    if (err) {
      console.log(err);
    } else {
      res.render("student/index.ejs", {
        meetings: curr_student_classes,
        username: req.user.username,
      });
    }
  });
});

app.get("/student/availableclasses", isLoggedIn, function (req, res) {
  TeacherClasses.find({}, function (err, allClasses) {
    if (err) {
      console.log(err);
    } else {
      res.render("student/availableclasses.ejs", {
        meetings: allClasses,
        username: req.user.username,
      });
    }
  });
});

app.get(
  "/student/availableclasses/:id/joinnewclassform",
  isLoggedIn,
  function (req, res) {
    TeacherClasses.findById(req.params.id, function (err, foundClass) {
      if (err) {
        console.log(err);
      } else {
        res.render("student/join_new_class_form.ejs", {
          meeting: foundClass,
          username: req.user.username,
        });
      }
    });
  }
);

app.post("/student/availableclasses", isLoggedIn, function (req, res) {
  var teacherclassid = req.body.teacherclassId;
  var teacherId;

  TeacherClasses.findById(teacherclassid, function (err, foundClass) {
    console.log("found class");
    console.log(foundClass);
    if (err) {
      console.log(err);
    } else {
      teacherId = foundClass.author;

      var new_request = {
        name: req.body.name,
        rollnumber: req.body.rollnumber,
        certificate: req.body.certificate,
        requestFromStudent: req.user._id,
        requestForClass: req.body.teacherclassId,
      };

      PendingRequest.create(new_request, function (err, createdRequest) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/student");
        }
      });
    }
  });

  // pending_requests.push(new_request);
});

// Middlewares

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // req.flash("error", "Please Login First!");
  res.redirect("/");
}

app.listen(process.env.PORT || 3000);
