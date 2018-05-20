// this file is all me.

const express = require('express');
// The below gives access to the various models
const Books = require("../models").Books;
const Loans = require("../models").Loans;
const Patrons = require("../models").Patrons;

const router = express.Router();


// Create new patron
router.get('/newpatron', (req, res) => {
  res.render('new_patron');
});

// List All Patrons
router.get('/patrons', (req, res) => {
  res.render('all_patrons');
});

module.exports = router; // NOTE add the module to router middleware object?
