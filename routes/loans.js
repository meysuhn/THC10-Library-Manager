// this file is all me.

const express = require('express');

// Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc

// This is Object Destructuring Syntax
const { Books, Loans, Patrons } = require('../models');
// const Books = require('../models').Books;
// const Loans = require('../models').Loans;
// const Patrons = require('../models').Patrons;
const moment = require('moment');

const router = express.Router();

// Get current date in specified format.
const getDate = () => moment().format('YYYY-MM-DD');

// Get date 7 days from today.
const getDate7DaysFromNow = () => moment(new Date().setDate(new Date().getDate() + 7)).format('YYYY-MM-DD');

// List All Loans
router.get('/loans', (req, res) => {
  const todaysDate = getDate();
  Loans.findAll({
    include: [ // Allows rendered template to access Patrons & Books data too.
      { model: Patrons },
      { model: Books },
    ],
  }).then((loans) => { // Pass the returned books to the render as an argument here,
    res.render('loans/all_loans', { loans, todaysDate }); // Shorthand. Otherwise could be {loans:loans}
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
    // WHERE returned_on != null ?? Try this.
    // NOTE Need to amend this to remove books that are already loaned out.
    Patrons.findAll().then((patrons) => {
      res.render('loans/new_loan', {
        availableBooks, patrons, newLoanDate, returnDate,
      });
    });
  }).catch((err) => {
    res.send(500);
  });
});


// POST New Loan
router.post('/new', (req, res) => {
  Loans.create(req.body).then(() => { // Call the create ORM method on the Loans model
    // res.render('new_loan', { newLoanDate, ReturnDate });
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


// GET Return BOOK.
router.get('/loans/:id/return', (req, res) => {
  const todaysDate = getDate();
  // This below is grabbing the id from the url? Check this in the forum. Link
  // this up with notes in loan_history.pug
  Loans.findById(req.params.id, {
    include: [
      {
        model: Books,
      },
      {
        model: Patrons,
      },
    ],
  }).then((loanDetail) => {
    res.render('loans/return_book', { todaysDate, loanDetail });
  });
});


// POST Return Loan
router.post('/loans/:id/return', (req, res) => {
  // const todaysDate = getDate();
  Loans.update(req.body, {
    where: [
      { book_id: req.params.id },
    ],
  }).then(() => { // Call the create ORM method on the Loans model
    // res.render('new_loan', { newLoanDate, ReturnDate });
    res.redirect('/loans');
  });
});

// GET Delete Loan
router.get('/loans/:id/delete', (req, res) => {
  // This below is grabbing the id from the url? Check this in the forum. Link
  // this up with notes in loan_history.pug
  Loans.findById(req.params.id, {
    include: [
      {
        model: Books,
      },
      {
        model: Patrons,
      },
    ],
  }).then((loanDetail) => {
    res.render('loans/delete', { loanDetail });
  });
});

// NOTE This not working for some reason...
// POST Delete Loan
router.post('/loans/:id/delete', (req, res) => {
  Loans.destroy(req.body, {
    where: [
      { book_id: req.params.id },
    ],
  }).then(() => {
    res.redirect('/loans');
  });
});


module.exports = router;
