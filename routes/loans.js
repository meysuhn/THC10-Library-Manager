// this file is all me.

const express = require('express');
// The below gives access to the various models
const Books = require("../models").Books;
const Loans = require("../models").Loans;
const Patrons = require("../models").Patrons;

const router = express.Router();


// List All Loans
router.get('/loans', (req, res) => {
  res.render('all_loans');
});

// New Loan
router.get('/newloan', (req, res) => { // NOTE second level domains don't get the stylesheet for some reason
  res.render('new_loan');
});

// List Overdue
router.get('/overdueloans', (req, res) => {
  res.render('overdue_loans');
});

// List Checked Out
router.get('/checkedloans', (req, res) => {
  res.render('checked_loans');
});

module.exports = router;
