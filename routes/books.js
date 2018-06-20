const express = require('express');

// Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
const Books = require("../models").Books;
const Loans = require("../models").Loans;
const Patrons = require("../models").Patrons;
const moment = require('moment');


const router = express.Router();

// Get current date in specified format.
const getDate = () => moment().format().toString().substring(0, 10);

// BOOK ROUTES //
router.get('/books', (req, res) => {
  Books.findAll().then((books) => { // Pass the returned books to the render as an argument heres
    res.render('all_books', { books }); // Shorthand. Otherwise could be {books:books}
  });
});

// GET new book form
router.get('/books/newbook', (req, res) => {
  res.render('new_book');
});


// Add New Book
router.post('/newbook', (req, res) => {
  Books.create(req.body).then(() => { // Call the create ORM method on the Books model
    res.redirect('/books');
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
    res.render('overdue_books', { overdueBooks });
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
    res.render('checked_books', { checkedBooks });
  });
});


// GET Individual Book Detail
router.get('/books/:id', (req, res) => {
  Books.findById(req.params.id).then((bookDetail) => {
    res.render('book_detail', { bookDetail });
  });
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

module.exports = router;
