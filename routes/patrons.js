
const express = require('express');
const { Books, Loans, Patrons } = require('../models'); // Object Destructuring Syntax
// const Books = require('../models').Books;
// const Loans = require('../models').Loans;
// const Patrons = require('../models').Patrons;
// Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
const router = express.Router();

// GET new patron form
router.get('/patrons/newpatron', (req, res) => {
  res.render('patrons/new_patron');
});

// Add New Patron
router.post('/newpatron', (req, res) => {
  Patrons.create(req.body).then(() => { // Call the create ORM method on the Books model
    res.redirect('/patrons');
  });
});

// Get All Patrons
router.get('/patrons', (req, res) => {
  Patrons.findAll().then((patrons) => {
    res.render('patrons/all_patrons', { patrons });
  });
});

// Get Patron Detail
router.get('/patrons/:id', (req, res) => {
  Patrons.findById(req.params.id).then((patronDetail) => {
    Loans.findAll({
      where: {
        patron_id: req.params.id,
      },
      include: [
        { model: Books },
        { model: Patrons },
      ],
    }).then((loanHistory) => {
      res.render('patrons/patron_detail', { patronDetail, loanHistory });
    });
  });
});


// POST Update Book Detail
router.post('/patrons/:id', (req, res) => {
  Patrons.findById(req.params.id).then((patronDetail) => {
    patronDetail.update(req.body); // update method returns a promise
  }).then(() => { // bookDetail here is the updated book
    res.redirect('/patrons');
  });
});

module.exports = router;
