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
const getDate = () => moment().format('YYYY-MM-DD');

// Get date 7 days from today.
const getDate7DaysFromNow = () => moment(new Date().setDate(new Date().getDate() + 7)).format('YYYY-MM-DD');

// List All Loans
router.get('/loans', (req, res) => {
  Loans.findAll({
    include: [ // Allows rendered template to access Patrons & Books data too.
      { model: Patrons },
      { model: Books },
    ],
  }).then((loans) => { // Pass the returned books to the render as an argument here,
    res.render('loans/all_loans', { loans }); // Shorthand. Otherwise could be {loans:loans}
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
    res.render('loans/checked_loans', { checkedloans });
  });
});


// GET New Loan Page
router.get('/loans/new', (req, res) => {
  const newLoanDate = getDate();
  const returnDate = getDate7DaysFromNow();
  Books.findAll().then((availableBooks) => {
    // NOTE Need to amend this to remove books that are already loaned out.
    Patrons.findAll().then((patrons) => {
      res.render('loans/new_loan', {
        availableBooks, patrons, newLoanDate, returnDate,
      });
    });
  });
});


// POST New Loan
router.post('/new', (req, res) => {
  // const newLoanDate = getDate();
  // const ReturnDate = getDate7DaysFromNow();
  Loans.create(req.body).then(() => { // Call the create ORM method on the Loans model
    // res.render('new_loan', { newLoanDate, ReturnDate });
    console.log('MASON!!!!');
    console.log(getDate7DaysFromNow());
    res.redirect('/loans');
  });
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
    res.render('loans/overdue_loans', { overdueLoans });
  });
});

// GET Return BOOK
router.get('/return', (req, res) => {
  // Need to get the data of the required book in here
  res.render('return_book');
});


// POST Return BOOK

module.exports = router;
