// this file is all me.

const express = require('express');
// The below gives access to the various models
const Books = require("../models").Books;
const Loans = require("../models").Loans;
const Patrons = require("../models").Patrons;

const router = express.Router();

// BOOK ROUTES //
router.get('/books', (req, res) => {
  res.render('all_books');
});

// GET new book
router.get('/newbook', (req, res) => {
  res.render('new_book');
});

// NOTE These need to be completed with a filter.
// NOTE Need to update index.pug for these two still to ensure links work properly.
// GET overdue books
router.get('/overduebooks', (req, res) => {
  res.render('overdue_books');
});

// GET Checked out books
router.get('/checkedbooks', (req, res) => {
  res.render('checked_books');
});

module.exports = router;
