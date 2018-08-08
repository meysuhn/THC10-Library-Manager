
const express = require('express');
const { Books, Loans, Patrons } = require('../models'); // Object Destructuring Syntax
// Require Books, Loans and Patrons Models in this routes file
// This allows us also to use the ORM methods here such as find() etc
const router = express.Router();

// GET new patron form
router.get('/patrons/new', (req, res) => {
  res.render('patrons/new_patron');
});


const errorFunction = (error, errorMessages) => {
  // NOTE See 'JS Patterns' notes 'Reassignment of Function Parameters'
  const addValidationErrorMessages = errorMessages;

  if (error.name === 'SequelizeValidationError') {
    console.log('If fired');
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
  // NOTE I can't see how the error values get back to the rendered file:
  // (1) Nothing is being returned and
  // (2) the values are being added to the addValidationErrorMessages object, not errorMessages
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
      res.render('patrons/patron_detail', {
        id: patronDetail.id,
        first_name: patronDetail.first_name,
        last_name: patronDetail.last_name,
        address: patronDetail.address,
        email: patronDetail.email,
        library_id: patronDetail.library_id,
        zip_code: patronDetail.zip_code,
        loanHistory,
      });
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
          console.log('Patrons Detail Error Fired');


          errorFunction(error, errorMessages);
          console.log(errorMessages);
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

// Get All Patrons
router.get('/patrons', (req, res) => {
  Patrons.findAll().then((patrons) => {
    res.render('patrons/all_patrons', { patrons });
  });
});


// // POST Update Patron Detail
// router.post('/patrons/:id', (req, res) => {
//   Patrons.findById(req.params.id).then((patronDetail) => {
//     patronDetail.update(req.body); // update method returns a promise
//   }).then(() => {
//     res.redirect('/patrons');
//     console.log('No error fired');
//     // NOTE this will fire even if there's a validation error. Here's the start of the problem.
//   }).catch((error) => {
//     const errorMessages = {}; // reset object else previous errors will persist on the object.
//     myerrors = {}; // reset object else previous errors will persist on the object.
//     myerrors = error.errors;
//
//     if (error.name === 'SequelizeValidationError') {
//       console.log('If fired');
//       for (let i = 0; i < myerrors.length; i += 1) {
//         if (myerrors[i].path === 'first_name') {
//           errorMessages.first_name = myerrors[i].message;
//         } else if (error.errors[i].path === 'last_name') {
//           errorMessages.last_name = myerrors[i].message;
//         } else if (error.errors[i].path === 'address') {
//           errorMessages.address = myerrors[i].message;
//         } else if (error.errors[i].path === 'email') {
//           errorMessages.email = myerrors[i].message;
//         } else if (error.errors[i].path === 'library_id') {
//           errorMessages.library_id = myerrors[i].message;
//         } else if (error.errors[i].path === 'zip_code') {
//           errorMessages.zip_code = myerrors[i].message;
//         }
//       }
//       console.log(errorMessages);
//       res.render('patrons/patron_detail', {
//         first_name: req.body.first_name,
//         last_name: req.body.last_name,
//         address: req.body.address,
//         email: req.body.email,
//         library_id: req.body.library_id,
//         zip_code: req.body.zip_code,
//         errorMessages,
//       });
//     }
//   });
// });

module.exports = router;
