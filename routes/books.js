const express = require('express');
const { Books, Loans, Patrons } = require('../models'); // This is Object Destructuring Syntax
// Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
// const Books = require('../models').Books;
// const Loans = require('../models').Loans;
// const Patrons = require('../models').Patrons;
const moment = require('moment');
// const search = require('../public/javascripts/search');
const router = express.Router();

// Get current date in specified format.
const getDate = () => moment().format().toString().substring(0, 10);


// GET ALL BOOKS //
router.get('/books', (req, res) => {
  Books.findAll().then((books) => { // Pass the returned books to the render as an argument heres
    res.render('books/all_books', { books }); // Shorthand. Otherwise could be {books:books}
  });
});

// GET new book form
router.get('/books/new', (req, res) => {
  res.render('books/new_book');
});

// NOTE This is a bit messy and should be cleaned up.
let myerrors = {};

// POST New Book
router.post('/books/new', (req, res) => {
  Books.create(req.body).then(() => { // Call the create ORM method on the Books model
    res.redirect('/books');
  }).catch((error) => {
    const errorMessages = {}; // reset object else previous errors will persist on the object.
    myerrors = {}; // reset object else previous errors will persist on the object.
    myerrors = error.errors;

    if (error.name === 'SequelizeValidationError') {
      console.log('If fired');
      for (let i = 0; i < myerrors.length; i += 1) {
        if (myerrors[i].path === 'title') {
          errorMessages.title = myerrors[i].message;
        } else if (error.errors[i].path === 'author') {
          errorMessages.author = myerrors[i].message;
        } else if (error.errors[i].path === 'genre') {
          errorMessages.genre = myerrors[i].message;
        } else if (error.errors[i].path === 'first_published') {
          errorMessages.first_published = myerrors[i].message;
        }
      }
      res.render('books/new_book', {
        title: req.body.title,
        author: req.body.author,
        genre: req.body.genre,
        first_published: req.body.first_published,
        errorMessages,
      });
    }
  });
});


// GET overdue books
router.get('/books/overduebooks', (req, res) => {
  const todaysDate = getDate();
  Loans.findAll({
    where: {
      returned_on: null,
      return_by: {
        $lte: todaysDate,
      },
    },
    include: [
      { model: Books },
    ],
  }).then((overdueBooks) => {
    res.render('books/overdue_books', { overdueBooks });
  });
});


// List Checked Out
router.get('/books/checkedbooks', (req, res) => {
  Loans.findAll({
    where: {
      returned_on: null,
    },
    include: [
      { model: Books },
    ],
  }).then((checkedBooks) => {
    res.render('books/checked_books', { checkedBooks });
  });
});


// GET Individual Book Detail
router.get('/books/:id', (req, res) => {
  Books.findById(req.params.id).then((bookDetail) => {
    Loans.findAll({
      where: {
        book_id: req.params.id,
      },
      include: [
        { model: Books },
        { model: Patrons },
      ],
    }).then((loanHistory) => {
      if (bookDetail) {
        res.render('books/book_detail', { bookDetail, loanHistory });
      } else {
        res.send(404);
        // This will fire if there's any problem with Books.findById
      }
    }).catch((err) => {
      // catch method handles the promise if it's rejected
      console.log(err.message);
      res.sendStatus(500);
      // NOTE This will fire only if something happens with Loans.findAll
    });
  }).catch((error) => {
    const errorMessages = {}; // reset object else previous errors will persist on the object.
    myerrors = {}; // reset object else previous errors will persist on the object.
    myerrors = error.errors;

    if (error.name === 'SequelizeValidationError') {
      console.log('If fired');
      for (let i = 0; i < myerrors.length; i += 1) {
        if (myerrors[i].path === 'title') {
          errorMessages.title = myerrors[i].message;
        } else if (error.errors[i].path === 'author') {
          errorMessages.author = myerrors[i].message;
        } else if (error.errors[i].path === 'genre') {
          errorMessages.genre = myerrors[i].message;
        } else if (error.errors[i].path === 'first_published') {
          errorMessages.first_published = myerrors[i].message;
        }
      }
      res.render('books/book_detail', {
        title: req.body.title,
        author: req.body.author,
        genre: req.body.genre,
        first_published: req.body.first_published,
        errorMessages,
      });
    }
  });

  // .catch((Error) => {
  //   console.log(Error);
  //   res.render('error', { Error });
  //   // if you don't render to an error page then the error will just hang.
  //   // Rendering to an error page keeps things tidy.
  // });
});


// POST Update Book Detail
router.post('/books/:id', (req, res) => {
  // Article needs to be found first
  Books.findById(req.params.id).then((bookDetail) => {
    bookDetail.update(req.body); // update method returns a promise
  }).then(() => { // bookDetail here is the updated book
    res.redirect('/books');
  });
});

// GET Delete Book
router.get('/books/:id/delete', (req, res) => {
// NOTE Need to reject delete if book is checked out.
  Books.findById(req.params.id, {
    include: [
      {
        model: Loans,
      },
    ],
  }).then((bookToDelete) => {
    res.render('books/delete', { bookToDelete });
  });
});

// // POST Delete Loan
// router.post('/loans/:id/delete', (req, res) => {
//   console.log('post fired');
//   console.log(req.params.id);
//   Loans.findById(req.params.id).then((loan) => {
//     console.log(loan);
//     return loan.destroy();
//     // console.log('Loans fired');
//   }).then(() => {
//     res.redirect('/loans');
//   });
// });


module.exports = router;
