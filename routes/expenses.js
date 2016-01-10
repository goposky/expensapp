var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}))

//build the REST operations at the base for expenses
//this will be accessible from http://127.0.0.1:3000/expenses if the default route for / is left unchanged
router.route('/')
    //GET all expenses
    .get(function(req, res, next) {
        //retrieve all expenses from Monogo
        mongoose.model('Expense').find({}, function (err, expenses) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.jade file in the views/expenses folder. We are also setting "expenses" to be an accessible variable in our jade view
                    html: function(){
                        res.render('expenses/index', {
                              title: 'All my Expenses',
                              "expenses" : expenses
                          });
                    },
                    //JSON response will show all expenses in JSON format
                    json: function(){
                        res.json(infophotos);
                    }
                });
              }     
        });
    })
    //POST a new expense
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var name = req.body.name;
        var category = req.body.category;
        var date = req.body.date;
        var amount = req.body.amount;
        //call the create function for our database
        mongoose.model('Expense').create({
            name : name,
            category : category,
            date : date,
            amount : amount
        }, function (err, expense) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  //Expense has been created
                  console.log('POST creating new expense: ' + expense);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("expenses");
                        // And forward to success page
                        res.redirect("/expenses");
                    },
                    //JSON response will show the newly created expense
                    json: function(){
                        res.json(expense);
                    }
                });
              }
        })
    });

/* GET New Expense page. */
router.get('/new', function(req, res) {
    res.render('expenses/new', { title: 'Add New Expense' });
});


// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Expense').findById(id, function (err, expense) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                 },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(expense);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});


router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Expense').findById(req.id, function (err, expense) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + expense._id);
        var expensedate = expense.date.toISOString();
        expensedate = expensedate.substring(0, expensedate.indexOf('T'))
        res.format({
          html: function(){
              res.render('expenses/show', {
                "expensedate" : expensedate,
                "expense" : expense
              });
          },
          json: function(){
              res.json(expense);
          }
        });
      }
    });
  });


//GET the individual expense by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the expense within Mongo
    mongoose.model('Expense').findById(req.id, function (err, expense) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the expense
            console.log('GET Retrieving ID: ' + expense._id);
            //format the date properly for the value to show correctly in our edit form
          var expensedate = expense.date.toISOString();
          expensedate = expensedate.substring(0, expensedate.indexOf('T'))
            res.format({
                //HTML response will render the 'edit.jade' template
                html: function(){
                       res.render('expenses/edit', {
                          title: 'Expense' + expense._id,
                        "expensedate" : expensedate,
                          "expense" : expense
                      });
                 },
                 //JSON response will return the JSON output
                json: function(){
                       res.json(expense);
                 }
            });
        }
    });
});


//PUT to update a expense by ID
router.put('/:id/edit', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var name = req.body.name;
    var category = req.body.category;
    var date = req.body.date;
    var amount = req.body.amount;

   //find the document by ID
        mongoose.model('Expense').findById(req.id, function (err, expense) {
            //update it
            expense.update({
                name : name,
                category : category,
                date : date,
                amount : amount
            }, function (err, expenseID) {
              if (err) {
                  res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                      //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                      res.format({
                          html: function(){
                               res.redirect("/expenses/" + expense._id);
                         },
                         //JSON responds showing the updated values
                        json: function(){
                               res.json(expense);
                         }
                      });
               }
            })
        });
});


//DELETE a Expense by ID
router.delete('/:id/edit', function (req, res){
    //find expense by ID
    mongoose.model('Expense').findById(req.id, function (err, expense) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            expense.remove(function (err, expense) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + expense._id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                          html: function(){
                               res.redirect("/expenses");
                         },
                         //JSON returns the item with the message that is has been deleted
                        json: function(){
                               res.json({message : 'deleted',
                                   item : expense
                               });
                         }
                      });
                }
            });
        }
    });
});


module.exports = router;

