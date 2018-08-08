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


const errorFunction = (error, errorMessages) => {
  // NOTE See 'JS Patterns' notes 'Reassignment of Function Parameters'
  const addValidationErrorMessages = errorMessages;

  if (error.name === 'SequelizeValidationError') {
    console.log('If fired');
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
  // NOTE I can't see how the error values get back to the rendered file:
  // (1) Nothing is being returned and
  // (2) the values are being added to the addValidationErrorMessages object, not errorMessages
};


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

// POST New Book
router.post('/books/new', (req, res) => {
  const errorMessages = {}; // reset object else previous errors will persist on the object.

  Books.create(req.body).then(() => { // Call the create ORM method on the Books model
    res.redirect('/books');
  }).catch((error) => {
    errorFunction(error, errorMessages);
    res.render('books/new_book', {
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      first_published: req.body.first_published,
      errorMessages,
    });
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
router.get('/books/:id', (req, res, error) => {
  Books.findById(req.params.id).then((bookDetail) => {
    // If a book has been found with that id then proceed to display it
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
        res.render('books/book_detail', {
          id: bookDetail.id,
          title: bookDetail.title,
          author: bookDetail.author,
          genre: bookDetail.genre,
          first_published: bookDetail.first_published,
          loanHistory,
        });
        // This will fire if there's any problem with Books.findById
      });
    } else if (error.status === 404) { // If a book is not present at that id display 404
      res.render('error', error); // how would I structure this then?
      // This might happen if user alters the id parameter directly in the url
      // res.send(404); // This is depracated. Advised to use res.sendStatus(status)
      // res.sendStatus(404); // These error codes have built in messages that will be displayed.
      // Would it be best to render the error pug though? I think so
    } else {
      console.log('Not worked maaan');
    }
  });
  // .catch((err) => {
  //       // catch method handles the promise if it's rejected
  //       console.log(err.message);
  //       res.sendStatus(500);
  //       // NOTE This will fire only if something happens with Loans.findAll
  //   } else {
  //     throw err;
  //   }
  // }).catch((err) => {
  //   if (err.name === 'Pingu') {
  //     // render
  //   } else {
  //     throw err;
  //   }
  // });
});

// .catch((Error) => {
//   console.log(Error);
//   // res.render('error', { Error });
//   // if you don't render to an error page then the error will just hang.
//   // Rendering to an error page keeps things tidy.
// });


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
          console.log('Books Detail Error Fired');
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
// NOTE Can you make some notes on this for yourself please.
// (1) the user tries to post changes. Changes are carried in bookDetail object.
// (2) If all info is correct then the ORM's UPDATE method will update the info
// (3) If however info fails validation, bookDetail will carry book data back to render
// (4) Any approved changes user has already made will be carried via bookDetail back to user.


// Doesn't work as you've no catch method.


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
