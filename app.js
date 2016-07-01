"use strict"
const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

const app = express();
const PORT = process.env.PORT || 8080;

const Mongo       = require("mongodb")
const MongoClient = Mongo.MongoClient;
const MONGODB_URI = "mongodb://127.0.0.1:27017/todo_app";

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded());
app.use(methodOverride("_method"));

let dbInstance;

MongoClient.connect(MONGODB_URI, (err, db) => {
  if (err) {
    throw err;
  }
  console.log(`Successfully connected to DB: ${MONGODB_URI}`);
  dbInstance = db;
});

// Fetch from Mongo all todos
app.get("/todos", (req, res) => {
  getAll(dbInstance, (err, results) => {
    const templateVars = {
      todos: results
    };
    res.render("todos/index", templateVars);
  });
});

// Form to create new todo
app.get("/todos/new", (req, res) => {
  res.render("todos/new");
});

// Create new todo in Mongo
app.post("/todos", (req, res) => {
  const desc = req.body.desc;

  insert(dbInstance, desc, (err) => {
    res.redirect("/todos");
  });
});


// Delete by (mongo) ID
app.delete("/todos/:id", (req, res) => {
  const id = req.params.id;
  remove(dbInstance, id, (err, result) => {
    if (err) { console.error(err); }
    res.redirect("/todos");
  });
});

/////////////////////

function getAll(db, cb) {
  db.collection("todos").find().toArray((err, results) => {
    return cb(err, results);
  });
}

function insert(db, desc, cb) {
  const todo = { desc: desc, completed: false }; // mongo doc
  db.collection("todos").insertOne(todo, (err, result) => {
    cb(err, result);
  });
}

function remove(db, id, cb) {
  let filter = { _id: Mongo.ObjectId(id) };
  db.collection("todos").deleteOne(filter, cb);
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// The code below here is to make sure
// That we close the conncetion to mongo
// When this node process terminates

function gracefulShutdown() {
  console.log("Shutting down gracefully...");
  try {
    dbInstance.close();
  } catch (e) {
    throw e;
  } finally {
    console.log("Bye for now");
    process.exit();
  }
}
process.on ('SIGTERM', gracefulShutdown); // listen for TERM signal .e.g. kill
process.on ('SIGINT', gracefulShutdown);  // listen for INT signal e.g. Ctrl-C
