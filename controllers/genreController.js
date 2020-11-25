const mongoose = require("mongoose");
const async = require("async");
const Genre = require("../models/genre");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// display list of all Genre.
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort([["name", "ascending"]])
    .exec(function (err, list_genres) {
      if (err) {
        return next(err);
      }
      res.render("genre_list", {
        title: "Genre List",
        genre_list: list_genres,
      });
    });
};

// display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  let id = mongoose.Types.ObjectId(req.params.id);

  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // no results
        let err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.render("genre_form", { title: "Create Genre" });
};

// handle Genre create on POST.
exports.genre_create_post = [
  // validate and sanitise the name field
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // process request after validation and sanitization
  (req, res, next) => {
    // extract the validation errors from a request
    const errors = validationResult(req);

    // create a genre object with escaped and trimmed data
    var genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // there are errors, render the form again with sanitized values/errors messages
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // data from form field
      // check if genre with same name already exists
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }
        if (found_genre) {
          // if genre exists, redirect to its detail page
          res.redirect(found_genre.url);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            // genre saved. redirect to genre detail page
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre: function (callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: function (callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        res.redirect("/catalog/genres");
      }
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel(
    {
      genre: (callback) => {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books: (callback) => {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre_books.length > 0) {
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return;
      } else {
        Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
          if (err) {
            return next(err);
          }
          res.redirect("/catalog/genres");
        });
      }
    }
  );
};

// display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id, (err, genre) => {
    if (err) {
      return next(err);
    }

    if (genre == null) {
      let err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }

    res.render("genre_form", { title: "Update Genre", genre: genre });
  });
};

// handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    let genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });

      return;
    } else {
      Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
        if (err) {
          return next(err);
        }

        res.redirect(thegenre.url);
      });
    }
  },
];
