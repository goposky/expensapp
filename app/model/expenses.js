var mongoose = require('mongoose');  
var expenseSchema = new mongoose.Schema({  
  name: String,
  category: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});
mongoose.model('Expense', expenseSchema);

