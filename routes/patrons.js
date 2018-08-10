
// Required Modules
const express = require('express');
const { Books, Loans, Patrons } = require('../models'); // Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
const moment = require('moment');
// /////////

// Globals
const router = express.Router();
const getDate = () => moment().format('YYYY-MM-DD'); // Get current date in specified format.
// /////////

// GET new patron form
router.get('/patrons/new', (req, res) => {
  res.render('patrons/new_patron');
});

// GET All Patrons
router.get('/patrons', (req, res) => {
  Patrons.findAll().then((patrons) => {
    res.render('patrons/all_patrons', { patrons });
  });
});


// Error Message Generator for patrons.js
const errorFunction = (error, errorMessages) => {
  // NOTE See 'JS Patterns' notes 'Reassignment of Function Parameters'
  const addValidationErrorMessages = errorMessages;

  if (error.name === 'SequelizeValidationError') {
    for (let i = 0; i < error.errors.length; i += 1) {
      if (error.errors[i].path === 'first_name') {
        addValidationErrorMessages.first_name = error.errors[i].message;
      } else if (error.errors[i].path === 'last_name') {
        addValidationErrorMessages.last_name = error.errors[i].message;
      } else if (error.errors[i].path === 'address') {
        addValidationErrorMessages.address = error.errors[i].message;
      } else if (error.errors[i].path === 'email') {
        addValidationErrorMessages.email = error.errors[i].message;
      } else if (error.errors[i].path === 'library_id') {
        addValidationErrorMessages.library_id = error.errors[i].message;
      } else if (error.errors[i].path === 'zip_code') {
        addValidationErrorMessages.zip_code = error.errors[i].message;
      }
    }
  }
};

// POST New Patron
router.post('/patrons/new', (req, res) => {
  const errorMessages = {}; // reset object else previous errors will persist on the object.

  Patrons.create(req.body)
    .then(() => { // Call the create ORM method on the Books model
      res.redirect('/patrons');
    }).catch((error) => {
      errorFunction(error, errorMessages);
      res.render('patrons/new_patron', {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        address: req.body.address,
        email: req.body.email,
        library_id: req.body.library_id,
        zip_code: req.body.zip_code,
        errorMessages,
      });
    });
});


// GET Patron Detail
router.get('/patrons/:id', (req, res, error) => {
  const todaysDate = getDate();
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
      if (patronDetail) {
        res.render('patrons/patron_detail', {
          id: patronDetail.id,
          first_name: patronDetail.first_name,
          last_name: patronDetail.last_name,
          address: patronDetail.address,
          email: patronDetail.email,
          library_id: patronDetail.library_id,
          zip_code: patronDetail.zip_code,
          loanHistory,
          todaysDate,
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


// POST Update Patron Detail
router.post('/patrons/:id', (req, res) => {
  const errorMessages = {}; // reset object else previous errors will persist on the object.

  Patrons.findById(req.params.id).then((patronDetail) => {
    patronDetail.update(req.body, { // update method returns a promise
      where: [{
        id: req.params.id,
      }],
    }).then(() => { // patronDetail here is the updated patron
      res.redirect('/patrons');
    }).catch((error) => {
      if (patronDetail) {
        Loans.findAll({
          where: {
            patron_id: req.params.id,
          },
          include: [
            { model: Books },
            { model: Patrons },
          ],
        }).then((loanHistory) => {
          errorFunction(error, errorMessages);
          res.render('patrons/patron_detail', {
            id: patronDetail.id,
            first_name: patronDetail.first_name,
            last_name: patronDetail.last_name,
            address: patronDetail.address,
            email: patronDetail.email,
            library_id: patronDetail.library_id,
            zip_code: patronDetail.zip_code,
            errorMessages,
            loanHistory,
          });
        });
      }
    });
  });
});

module.exports = router;
