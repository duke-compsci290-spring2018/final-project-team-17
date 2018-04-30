var express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  mongodb = require("mongodb"),
  ObjectID = mongodb.ObjectID,
  db,
  fs = require('fs-extra'),
  path = require('path'),
  shortid = require('shortid')


const MongoClient = require('mongodb').MongoClient

app.use(express.static(__dirname + '/View'));
app.use(express.static(__dirname + '/Script'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

MongoClient.connect("mongodb://aditya:aditya123@ds155577.mlab.com:55577/cs290-final", function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  db = database;
  console.log("Database connection ready");
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

app.get('/',function(req, res){
  res.sendFile('index.html');
});

app.get('/guest',function(req, res){
  res.sendFile(__dirname + '/View/guest.html');
});

app.get('/admin',function(req, res){
  res.sendFile(__dirname + '/View/admin.html');
});


// app.get("/:userid", function(req, res) {
//   db.collection("users").findOne({ "username": req.params.userid }, function(err, doc) {
//     if (err) {
//       handleError(res, err.message, "Failed to get user");
//     } else {
//       if (doc == null) {
//         console.log("User not found");
//       } else {
//         res.sendFile(__dirname + '/View/login.html');
//       }
//     }
//   });
// });

app.post("/create-account", function(req, res) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var pin = req.body.pin;
  // var code = new ObjectID();
  var id = firstname[0] + lastname[0] + shortid.generate();
  var user_info = {
    rels: []
  }
  db.collection("users").insertOne({"username": id, "firstname" : firstname, "lastname" : lastname, "pin" : pin, "failed-login-attempts" : 0, "locked" : false, "last-login": new Date(), "last-locked": "", "user_info" : user_info}, function(err) {
    if (err) {
      console.log("Error adding new user! " + err);
      process.exit(1);
    } else {
      res.send(id);
    }
  });
});

app.get("/:userid", function(req, res) {
  db.collection("users").findOne({ "username": req.params.userid }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get user");
    } else {
      if (doc == null) {
        console.log("User not found");
      } else {
        res.sendFile(__dirname + '/View/login.html');
      }
    }
  });
});

app.post("/login", function(req, res) {
  var pin = req.body.pin;
  var username = req.body.username;
  console.log(username)
  db.collection("users").findOne({username : username}, function(err, doc) {
    if (err) {
      console.log("Error in login. User not found.");
      process.exit(1);
    } else {
        console.log(doc)
        var newDoc = doc;
        if (doc["pin"] == pin && !doc["locked"]) {

          var diff = (new Date().getTime() - new Date(doc["last-login"])) / 60000;
          newDoc["last-login"] = new Date();
          newDoc["failed-login-attempts"] = 0;
          db.collection("users").updateOne({_id : doc["_id"]}, newDoc, function(err, data) {
            if (err) {
              console.log("There was an error updating a record " + err);
              res.send({"status": false, "reason": "Unknown error.", "locked" : false})
            } else {
              console.log(newDoc);
              res.send({"status": true, "reason": "Successful login.", "locked": false, "login-diff" : diff, "userdata": doc});
            }
          });

        } else if (doc["pin"] != pin) {
            console.log("Incorrect pin.")
            var attempts = doc["failed-login-attempts"];
            newDoc["failed-login-attempts"] = attempts + 1;

            if (attempts >= 2) {
              newDoc["locked"] = true;
              newDoc["last-locked"] = new Date();
              db.collection("users").updateOne({_id : doc["_id"]}, newDoc, function(err, data) {
                if (err) {
                  console.log("There was an error updating a record " + err);
                  res.send({"status": false, "reason": "Unknown error.", "locked" : true})
                } else {
                  console.log(newDoc);
                  res.send({"status": false, "reason": "Too many login attempts. Account is locked for 12 hours.", "locked": true});
                }
              });
            } else {
              newDoc["locked"] = false;
              var attemptsRemaining = 3 - (attempts + 1);
              db.collection("users").updateOne({_id : doc["_id"]}, newDoc, function(err, data) {
                if (err) {
                  console.log("There was an error updating a record " + err);
                  res.send({"status": false, "reason": "Unknown error.", "locked" : false})
                } else {
                  console.log(newDoc);
                  var msg = "Incorrect PIN. " + attemptsRemaining + " attempts remaining.";
                  res.send({"status": false, "reason": msg, "locked": false});
                }
              });
            }

        }
    }
  });
});

app.post("/admin-login", function(req, res) {
  var pin = req.body.pin;
  db.collection("users").findOne({username : "admin"}, function(err, doc) {
    if (err) {
      console.log("Error in login. Admin not found.");
      process.exit(1);
    } else {
        console.log(doc)
        var newDoc = doc;
        if (doc["pin"] == pin) {
          db.collection("users").find({}).toArray(function (err, docs) {
            if (err) throw err;
            res.send({"status": true, "reason": "Successful admin login.", "userdata": docs});
          });
        } else if (doc["pin"] != pin) {
          res.send({"status": false, "reason": "Failed to login admin", "userdata": null});
        }
    }
  });
});

app.post("/new-relation", function(req, res) {
  var rel_score = req.body.score;
  var rel_name = req.body.name;
  var rel_relation = req.body.relation;
  var rel_usn = req.body.username;
  console.log(rel_usn)
  db.collection("users").findOne({ "username":  rel_usn}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get user");
    } else {
      if (doc == null) {
        console.log("User not found");
      } else {
        var date = new Date();
        doc.user_info.rels.push({
          "name": rel_name,
          "relation": rel_relation,
          "score": rel_score,
          "added": date,
          "last_interaction": null,
          "lend": [],
          "interactions": {
            "activity": ["Initial"],
            "time": [date],
            "score": [rel_score]
          },
          "scheduled-interactions": []
        })
        db.collection("users").updateOne({_id : doc["_id"]}, doc, function(err, data) {
          if (err) {
            console.log("There was an error updating a record " + err);
            res.send({"success": false, "msg": "Failed to add new relation!"})
          } else {
            console.log(doc);
            res.send({"success": true, "msg": "New relation successfully added!", "user_info": data});
          }
        });
      }
    }
  });
});

app.post("/update-relation", function(req, res) {
  var rel_usn = req.body.username;
  var updated_rels = req.body.doc;
  console.log(rel_usn)
  db.collection("users").findOne({"username":  rel_usn}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get user");
    } else {
      if (doc == null) {
        console.log("User not found");
      } else {
        doc.user_info.rels = updated_rels;
        var return_doc = doc;
        db.collection("users").updateOne({_id : doc["_id"]}, doc, function(err, data) {
          console.log("DATA: ", data)
          if (err) {
            console.log("There was an error updating a record " + err);
            res.send({"success": false, "msg": "Failed to schedule interaction"})
          } else {
            res.send({"success": true, "msg": "Successfully scheduled interaction!", "user_info": return_doc});
          }
        });
      }
    }
  });
});

app.post("/unlock-user", function(req, res) {
  var lock_user = req.body.username;
  lock_status = req.body.lock_status = "false" ? false : true;
  var lock_status = req.body.lock_status;
  db.collection("users").findOne({"username":  lock_user}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get user");
    } else {
      if (doc == null) {
        console.log("User not found");
      } else {
        db.collection("users").update({_id : doc["_id"]}, {$set: {"locked": lock_status}} , function(err, data) {
          if (err) {
            console.log("There was an error updating a record " + err);
            res.send({"success": false, "msg": "Failed to toggle user's lock status"})
          } else {
            res.send({"success": true, "msg": "Successfully toggled user's lock status!"});
          }
        });
      }
    }
  });

})
