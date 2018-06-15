// this file is all me.

const express = require('express');

// Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
const Books = require("../models").Books;
const Loans = require("../models").Loans;
const Patrons = require("../models").Patrons;

const router = express.Router();


// GET new patron form
router.get('/newpatron', (req, res) => {
  res.render('new_patron');
});

// Add New Patron
router.post('/newpatron', (req, res) => {
  Patrons.create(req.body).then(() => { // Call the create ORM method on the Books model
    res.redirect('/patrons');
  });
});


// List All Patrons
router.get('/patrons', (req, res) => {
  Patrons.findAll().then((patrons) => {
    res.render('all_patrons', { patrons });
  });
});

// Get Patron Detail
router.get('/patrons/:id', (req, res) => {
  Patrons.findById(req.params.id).then((patron) => {
    res.render('patron_detail', { patron });
  });

  // Patrons.findOne(req.params.id).then((onePatron) => {
  //   // console.log(onePatron);
  //   res.render('patron_detail', { onePatron });
  // });

  // Patrons.findOne({
  //   where: [
  //     { id: req.params.id },
  //   ],
  // }).then(onePatron);
  // console.log('onePatron');
  // res.render('patron_detail', { onePatron });
});

// router.get('/patrondetail', (req, res) => {
//   Patrons.find().then((patron) => { // You need to build on this find method.
//     res.render('patron_detail', { patron });
//   });
// });

module.exports = router; // NOTE add the module to router middleware object?
