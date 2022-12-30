//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/todoDB", {useNewUrlParser: true});


const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

// Creating default data to be stored in the database
const item1 = new Item({
  name: "Welcome to your todolist"
});
const item2 = new Item({
  name: "Hit the + button to add a new item"
});
const item3 = new Item({
  name: "Check the item to delete it"
});

const defaultItems = [item1, item2, item3];


// List Schema and type definition
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {
  Item.find({}, function(err, items) {
    if (items.length === 0) {
      // Inserting many elements into the database.
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
        console.log("Successfully added new items to the database");
        }
      }); 
      res.redirect("/");     
    }   else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });
});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
      name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.check;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Removed");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName},
      {$pull: {items: {_id: checkedItemID}}}, 
      function(err, foundList) {
         if (!err) {
          res.redirect("/" + listName);
         } 
    });
  }

  
})

app.get("/:route", function(req, res) {
  const listName = _.capitalize(req.params.route);

  List.findOne({name: listName}, function(err, data) {
    if (! err) {
      if (! data) {
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        // Shows an existing list
        res.render("list", {listTitle: data.name, newListItems: data.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
