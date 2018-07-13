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
      const availableBooks = []; // array to contain id of each available book
      const unavailableBooks = []; // array containing id of each loaned (unavailable) book

      // Separate out each model to its own variable
      const books = allModelData[0];
      const loans = allModelData[1];
      const patrons = allModelData[2];

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


// // POST New Loan
// router.post('/loans/new', (req, res) => {
//   Loans.create(req.body).then(() => { // Call the create ORM method on the Loans model
//     // res.render('new_loan', { newLoanDate, ReturnDate });
//     res.redirect('/loans');
//   });
// });

// NOTE This is a bit messy and should be cleaned up.
let myerrors = {};

// POST New Loan
router.post('/loans/new', (req, res) => {
  Loans.create(req.body).then(() => { // Call the create ORM method on the Loans model
    // res.render('new_loan', { newLoanDate, ReturnDate });
    res.redirect('/loans');
  }).catch((error) => {
    const errorMessages = {}; // reset object else previous errors will persist on the object.
    myerrors = {}; // reset object else previous errors will persist on the object.
    myerrors = error.errors;

    if (error.name === 'SequelizeValidationError') {
      console.log('If fired');
      for (let i = 0; i < myerrors.length; i += 1) {
        if (myerrors[i].path === 'loaned_on') {
          errorMessages.loaned_on = myerrors[i].message;
        } else if (error.errors[i].path === 'return_by') {
          errorMessages.return_by = myerrors[i].message;
        } else if (error.errors[i].path === 'returned_on') {
          errorMessages.returned_on = myerrors[i].message;
        }
      }
      res.render('loans/new_loan', {
        book_id: req.body.book_id,
        patron_id: req.body.patron_id,
        loaned_on: req.body.loaned_on,
        return_by: req.body.return_by,
        returned_on: req.body.returned_on,
        errorMessages,
        patrons,
      });
    }
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
