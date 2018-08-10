
// Required Modules
const express = require('express');
const { Books, Loans, Patrons } = require('../models'); // Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
const moment = require('moment');
const Sequelize = require('sequelize');
// /////////

// Globals
const router = express.Router();
const getDate = () => moment().format('YYYY-MM-DD'); // Get current date in specified format.
const getDate7DaysFromNow = () => moment(new Date().setDate(new Date().getDate() + 7)).format('YYYY-MM-DD'); // Get date 7 days from today.
const Op = Sequelize.Op; // sequelize operator

// Global Vars for GET and POST New Loan
let availableBooks = []; // array to contain id of each available book
let patrons = []; // Make patrons data available to catch method on 'POST New Loan'
// /////////


// Error Message Generator for loans.js
// (1) Error object get passed in here
// (2) If Sequelize type error it will create messages and display to user
// (3) If unhandled error then it will ultimately throw to final error handler in app.js
const errorFunction = (error, errorMessages) => {
  // NOTE See 'JS Patterns' notes 'Reassignment of Function Parameters'
  const addValidationErrorMessages = errorMessages;

  if (error.name === 'SequelizeValidationError') {
    for (let i = 0; i < error.errors.length; i += 1) {
      if (error.errors[i].path === 'loaned_on') {
        addValidationErrorMessages.loaned_on = error.errors[i].message;
      } else if (error.errors[i].path === 'return_by') {
        addValidationErrorMessages.return_by = error.errors[i].message;
      } else if (error.errors[i].path === 'returned_on') {
        addValidationErrorMessages.returned_on = error.errors[i].message;
      }
    }
  }
};


// GET All Loans
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


// GET Checked Out Loans
router.get('/loans/checkedloans', (req, res) => {
  const todaysDate = getDate();
  Loans.findAll({
    where: {
      returned_on: null,
    },
    include: [
      { model: Patrons },
      { model: Books },
    ],
  }).then((checkedloans) => {
    console.log(checkedloans);
    res.render('loans/checked_loans', { checkedloans, todaysDate });
  });
});

// GET Overdue Loans
router.get('/loans/overdueloans', (req, res) => {
  const todaysDate = getDate();
  console.log(todaysDate);
  Loans.findAll({
    where: {
      return_by: {
        [Op.lt]: todaysDate, // Less Than Operator
      },
      returned_on: null,
    },
    include: [
      { model: Patrons },
      { model: Books },
    ],
  }).then((overdueLoans) => {
    console.log(overdueLoans);
    res.render('loans/overdue_loans', { overdueLoans, todaysDate });
  });
});


// GET New Loan Page
router.get('/loans/new', (req, res) => {
  const newLoanDate = getDate();
  const returnDate = getDate7DaysFromNow();
  const allBooks = Books.findAll();
  const allLoans = Loans.findAll({
    where: {
      returned_on: null,
    },
  });
  const allPatrons = Patrons.findAll();

  Promise.all([allBooks, allLoans, allPatrons])
  // Ensure all findAlls have completed before next step.
    .then((allModelData) => {
      availableBooks = []; // reset value of global variable else values will repeat.
      const unavailableBooks = []; // array containing id of each loaned (unavailable) book

      // Separate out each model to its own variable
      const books = allModelData[0];
      const loans = allModelData[1];
      patrons = allModelData[2];

      // Loop over each loan record and keep only its book.id
      loans.forEach((loan) => {
        unavailableBooks.push(loan.book_id);
      });

      // Loop over each book
      // (1) if unavailableBooks[] has a matching id in its array the index is returned
      // the returned index will have to be at least 0
      // thus <0 results in that id not being pushed to availableBooks[]
      // (2) if book.id not present then booked is not loaned out
      // indexOf returns -1 in this case, as it can't find an index with a matching book.id
      // this available book's id is pushed to availableBooks which is sent to pug.

      books.forEach((book) => {
        if (unavailableBooks.indexOf(book.id) < 0) {
          availableBooks.push(book);
        }
      });
      res.render('loans/new_loan', {
        availableBooks, patrons, newLoanDate, returnDate,
      });
    }).catch((err) => {
      res.send(err); // NOTE this needs wiring up with error.pug
    });
});


// POST New Loan
router.post('/loans/new', (req, res) => {
  const errorMessages = {}; // reset object else previous errors will persist on the object.
  Loans.create(req.body).then(() => { // Call the create ORM method on the Loans model
    res.redirect('/loans');
  }).catch((error) => {
    errorFunction(error, errorMessages);
    res.render('loans/new_loan', {
      loaned_on: req.body.loaned_on,
      return_by: req.body.return_by,
      errorMessages,
      availableBooks,
      patrons,
    });
  });
});


// GET Return Loan
router.get('/loans/:id/return', (req, res) => {
  const todaysDate = getDate();
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
  const errorMessages = {}; // reset object else previous errors will persist on the object.
  Loans.update(req.body, {
    where: [
      { id: req.params.id },
      // match the params id (from line 18 of return_book.pug)
      // against the loan in the database with the matching id.
    ],
  }).then(() => { // Call the create ORM method on the Loans model
    res.redirect('/loans');
  }).catch((error) => {
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
      errorFunction(error, errorMessages);
      res.render('loans/return_book', {
        loanDetail,
        errorMessages,
      });
    });
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

// POST Delete Loan
router.post('/loans/:id/delete', (req, res) => {
  Loans.findById(req.params.id)
    .then(loan => loan.destroy()).then(() => {
      res.redirect('/loans');
    });
});

module.exports = router;
