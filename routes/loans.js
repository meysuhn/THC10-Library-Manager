// this file is all me.

const express = require('express');

// Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
const Books = require('../models').Books;
const Loans = require('../models').Loans;
const Patrons = require('../models').Patrons;
const moment = require('moment');

const router = express.Router();

// Get current date in specified format.
const getDate = () => moment().format().toString().substring(0, 10);

// List All Loans
router.get('/loans', (req, res) => {
  Loans.findAll({
    include: [ // Allows rendered template to access Patrons & Books data too.
      { model: Patrons },
      { model: Books },
    ],
  }).then((loans) => { // Pass the returned books to the render as an argument here,
    res.render('all_loans', { loans }); // Shorthand. Otherwise could be {loans:loans}
  });
});


// List Checked Out
router.get('/loans/checkedloans', (req, res) => {
  Loans.findAll({
    where: {
      returned_on: null,
    },
    include: [
      { model: Patrons },
      { model: Books },
    ],
  }).then((checkedloans) => {
    res.render('checked_loans', { checkedloans });
  });
});


// New Loan
router.get('/loans/newloan', (req, res) => { // NOTE second level domains don't get the stylesheet for some reason
  res.render('new_loan');
});

// List Overdue
router.get('/loans/overdueloans', (req, res) => {
  const todaysDate = getDate();
  Loans.findAll({
    where: {
      returned_on: null,
      return_by: {
        $lte: todaysDate,
      },
    },
    include: [
      { model: Patrons },
      { model: Books },
    ],
  }).then((overdueLoans) => {
    res.render('overdue_loans', { overdueLoans });
  });
});

module.exports = router;
