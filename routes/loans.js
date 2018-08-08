const express = require('express');
const { Books, Loans, Patrons } = require('../models'); // This is Object Destructuring Syntax
// Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
const moment = require('moment');

const router = express.Router();

// Get current date in specified format.
const getDate = () => moment().format('YYYY-MM-DD');

// Get date 7 days from today.
const getDate7DaysFromNow = () => moment(new Date().setDate(new Date().getDate() + 7)).format('YYYY-MM-DD');


// (1) Error object get passed in here
// (2) If Sequelize type error it will create messages and display to user
// (3) If unhandled error then it will ultimately throw to final error handler in app.js
const errorFunction = (error, errorMessages) => {
  // NOTE See 'JS Patterns' notes 'Reassignment of Function Parameters'
  const addValidationErrorMessages = errorMessages;

  if (error.name === 'SequelizeValidationError') {
    console.log('If fired');
    for (let i = 0; i < error.errors.length; i += 1) {
      if (error.errors[i].path === 'loaned_on') {
        addValidationErrorMessages.loaned_on = error.errors[i].message;
      } else if (error.errors[i].path === 'return_by') {
        addValidationErrorMessages.return_by = error.errors[i].message;
      } else if (error.errors[i].path === 'returned_on') {
        addValidationErrorMessages.returned_on = error.errors[i].message;
      }
    }
  } // else if NOTE !!! to work on errors here!
  // NOTE I can't see how the error values get back to the rendered file:
  // (1) Nothing is being returned and
  // (2) the values are being added to the addValidationErrorMessages object, not errorMessages
};


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

let availableBooks = []; // array to contain id of each available book
let patrons = []; // Make patrons data available to catch method on 'POST New Loan'

// GET New Loan Page
router.get('/loans/new', (req, res) => {
  const newLoanDate = getDate();
  console.log(newLoanDate);
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
      console.log(patrons);
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
    // res.render('new_loan', { newLoanDate, ReturnDate });
    res.redirect('/loans');
  }).catch((error) => {
    console.log("REQUEST BODY");
    console.log(req.body);
    errorFunction(error, errorMessages);

    // const thePatrons = Patrons.findAll();
    // Promise.resolve(thePatrons).then(() => {
    //   const patrons = thePatrons[0];
    //   console.log("HERE ARE THE PATRONS");
    //   console.log(thePatrons.Patrons);
    //   // console.log(errorMessages);
    // });

    res.render('loans/new_loan', {
      loaned_on: req.body.loaned_on,
      return_by: req.body.return_by,
      // returned_on: req.body.returned_on,
      errorMessages,
      availableBooks,
      patrons,
    });
    // NOTE still to finish off this.
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
  console.log('GET REQ PARAMS ID:');
  console.log(req.params.id);
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
    console.log('GET LOAN DETAIL');
    console.log(loanDetail);
    res.render('loans/return_book', { todaysDate, loanDetail });
  });
});


// POST Return Loan
router.post('/loans/:id/return', (req, res) => {
  const errorMessages = {}; // reset object else previous errors will persist on the object.
  console.log('1st POST REQ PARAMS ID:');
  console.log(req.params.id); // NOTE this is blank.
  // const todaysDate = getDate();
  Loans.update(req.body, {
    where: [
      { id: req.params.id },
      // match the params id (from line 18 of return_book.pug)
      // against the loan in the database with the matching id.
    ],
  }).then(() => { // Call the create ORM method on the Loans model
    // res.render('new_loan', { newLoanDate, ReturnDate });
    res.redirect('/loans');
  }).catch((error) => {
    // NOTE the problem is around here.
    console.log('2nd POST REQ PARAMS ID:');
    console.log(req.params.id); // NOTE this is blank.
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
      console.log(loanDetail);
      // NOTE loanDetail is null. This is the problem.
      errorFunction(error, errorMessages);
      res.render('loans/return_book', {
        // id: bookDetail.id,
        loanDetail,
        errorMessages,
        // NOTE all the info still needs to be available to return book.
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
  console.log('post fired');
  console.log(req.params.id);
  Loans.findById(req.params.id).then((loan) => {
    console.log(loan);
    return loan.destroy();
    // console.log('Loans fired');
  }).then(() => {
    res.redirect('/loans');
  });
});


module.exports = router;
