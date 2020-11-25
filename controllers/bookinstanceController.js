const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");

var Book = require("../models/book");
var async = require("async");

// display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
  BookInstance.find()
    .populate("book")
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      // successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        var err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_detail", {
        title: "Copy: " + bookinstance.book.title,
        bookinstance: bookinstance,
      });
    });
};

// display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, "title").exec(function (err, books) {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  });
};

// handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitise fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });
      return;
    } else {
      // Data from form is valid.
      bookinstance.save(function (err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      });
    }
  },
];

// display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findById(req.params.id)
        .populate("book")
        .exec((err, bookinstance) => {
          if (err) {
            return next(err);
          }
          if (bookinstance == null) {
            res.redirect("/catalog/bookinstances");
          }
          res.render("bookinstance_delete", {
            title: "Delete BookIntance",
            bookinstance: bookinstance,
          });
        });
    },
  });
};

// handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findByIdAndRemove(
        req.body.id,
        function deleteBookInstance(err) {
          if (err) {
            return next(err);
          }
          res.redirect("/catalog/bookinstances");
        }
      );
    },
  });
};

// display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  async.parallel(
    {
      bookinstance: (callback) => {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
      books: (callback) => {
        Book.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.bookinstance == null) {
        let err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }

      res.render("bookinstance_form", {
        title: "Update  BookInstance",
        book_list: results.books,
        selected_book: results.bookinstance.book._id,
        bookinstance: results.bookinstance,
      });
    }
  );
};

// handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    let bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec((err, books) => {
        if (err) {
          return next(err);
        }
        res.render("bookinstance_form", {
          title: "Update BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });

      return;
    } else {
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        (err, thebookinstance) => {
          if (err) {
            return next(err);
          }

          res.redirect(thebookinstance.url);
        }
      );
    }
  },
];
