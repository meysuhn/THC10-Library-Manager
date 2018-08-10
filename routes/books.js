
// Required Modules
const express = require('express');
const { Books, Loans, Patrons } = require('../models'); // Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc.
const moment = require('moment');
const Sequelize = require('sequelize');
// /////////

// Globals
const router = express.Router();
const getDate = () => moment().format().toString().substring(0, 10); // Get current date in specified format.
const Op = Sequelize.Op; // sequelize operator
// /////////

// Error Message Generator for books.js
const errorFunction = (error, errorMessages) => {
  // NOTE See 'JS Patterns' notes 'Reassignment of Function Parameters'
  const addValidationErrorMessages = errorMessages;

  if (error.name === 'SequelizeValidationError') {
    for (let i = 0; i < error.errors.length; i += 1) {
      if (error.errors[i].path === 'title') {
        addValidationErrorMessages.title = error.errors[i].message;
      } else if (error.errors[i].path === 'author') {
        addValidationErrorMessages.author = error.errors[i].message;
      } else if (error.errors[i].path === 'genre') {
        addValidationErrorMessages.genre = error.errors[i].message;
      } else if (error.errors[i].path === 'first_published') {
        addValidationErrorMessages.first_published = error.errors[i].message;
      }
    }
  }
};


// GET All Books
router.get('/books', (req, res) => {
  Books.findAll().then((books) => { // Pass the returned books to the render as an argument here
    res.render('books/all_books', { books }); // Shorthand. Otherwise could be {books:books}
  });
});

// GET New Book
router.get('/books/new', (req, res) => {
  res.render('books/new_book');
});

// POST New Book
router.post('/books/new', (req, res) => {
  const errorMessages = {}; // reset object else previous errors will persist on the object.
  Books.create(req.body).then(() => { // Call the create ORM method on the Books model
    res.redirect('/books');
  }).catch((error) => {
    if (error.name === 'SequelizeValidationError') {
      errorFunction(error, errorMessages); // Call Error Message Generator
      res.render('books/new_book', {
        title: req.body.title,
        author: req.body.author,
        genre: req.body.genre,
        first_published: req.body.first_published,
        errorMessages,
      });
    } else {
      throw error;
    }
  }).catch((error) => {
    res.status(404).send(error);
  });
});

// GET Overdue Books
router.get('/books/overduebooks', (req, res) => {
  const todaysDate = getDate();
  Loans.findAll({
    where: {
      return_by: {
        [Op.lt]: todaysDate, // Less Than Operator
      },
      returned_on: null,
    },
    include: [
      { model: Books },
    ],
  }).then((overdueBooks) => {
    res.render('books/overdue_books', { overdueBooks, todaysDate });
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
router.get('/books/:id', (req, res, error) => {
  Books.findById(req.params.id).then((bookDetail) => {
    Loans.findAll({
      where: {
        book_id: req.params.id,
      },
      include: [
        { model: Books },
        { model: Patrons },
      ],
    }).then((loanHistory) => { // bookDetail automatically passed in here.
      if (bookDetail) {
        res.render('books/book_detail', {
          id: bookDetail.id,
          title: bookDetail.title,
          author: bookDetail.author,
          genre: bookDetail.genre,
          first_published: bookDetail.first_published,
          loanHistory,
        });
      } else {
        res.status(404).render('error', error); // Set a status code and render error template.
      }
    }).catch(() => {
      if (error) {
        res.status(500).render('error', error); // Set a status code and render error template.
      }
    });
  });
});


// POST Update Book Detail
router.post('/books/:id', (req, res) => {
  const errorMessages = {}; // reset object else previous errors will persist on the object.

  // Article needs to be found first
  Books.findById(req.params.id).then((bookDetail) => {
  //   bookDetail.update(req.body); // update method returns a promise

    bookDetail.update(req.body, {
      where: [{
        id: req.params.id,
      }],
    }).then(() => { // bookDetail here is the updated book
      res.redirect('/books');
    }).catch((error) => {
      if (bookDetail) {
        Loans.findAll({
          where: {
            book_id: req.params.id,
          },
          include: [
            { model: Books },
            { model: Patrons },
          ],
        }).then((loanHistory) => {
          errorFunction(error, errorMessages);
          res.render('books/book_detail', {
            id: bookDetail.id,
            title: bookDetail.title,
            author: bookDetail.author,
            genre: bookDetail.genre,
            first_published: bookDetail.first_published,
            errorMessages,
            loanHistory,
          });
        });
      }
    });
  });
});
// (1) the user tries to post changes. Changes are carried in bookDetail object.
// (2) If all info is correct then the ORM's UPDATE method will update the info
// (3) If however info fails validation, bookDetail will carry book data back to render
// (4) Any approved changes user has already made will be carried via bookDetail back to user.


module.exports = router;
