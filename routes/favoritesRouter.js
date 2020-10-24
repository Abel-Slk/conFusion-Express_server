const express  = require('express'); 
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorites = require('../models/favorite');
const mongoose = require('mongoose');

const favRouter = express.Router();

favRouter.use(bodyParser.json());

favRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => {
        Favorites.findOne({ user: req.user._id }) // find the list of favorites for the user that is sending this GET request (authenticate.verifyUser will verify the user by his bearer token and store info about him in req.user)
        .populate('user')
        .populate('dishes')
        .then(favorites => {
            if (!favorites || favorites.dishes == []) { // dishes might become an empty array if we delete all the items one by one 
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('The user ' + req.user + ' does not seem to have a list of favorites');
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json'); 
                res.json(favorites);
            }
        },
        err => next(err)
        )
        .catch(err => next(err));
}) 
.post(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => {
        Favorites.findOne({ user: req.user._id }) // find the list of favorites of that user
        .then(favorites => {
            if (!favorites) { 
                favorites = Favorites.create({ user: req.user._id });
            }
            
            if ( !(Array.isArray(req.body)) ) { // if req.body is not an array like [ {"_id":"dish ObjectId"}, ..., {"_id":"dish ObjectId"} ], but just one element like {"_id":"dish ObjectId"}
                let alreadyExists = false;
                for (var i = 0; i < (favorites.dishes.length); i++) { 
                    if (favorites.dishes[i] == req.body._id) { // I don't need to use the id() method on favorites.dishes — cause dishes doesn't contain subdocuments. Earlier with comments we had a comments docs inside a dish doc - THAT was subdocuments - But here I don’t have subdocuments - Just the prop dishes which is an ordinary array of strings

                        alreadyExists = true;

                        res.statusCode  = 403;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('The dish ' + req.body._id + ' that you are trying to add to favorites is already in the favorites!');
                    }
                }
                if (!alreadyExists)
                favorites.dishes.push(req.body); // A minor bug: everything is working, but after I DELETE all the favorites, the first time I send a POST request, it says can't use length of undefined! So it looks like favorites.dishes is undefined at the moment! But after the first request they somehow become defined, and subsequent request work well!
            }
            else { // if req.body is an array like [ {"_id":"dish ObjectId"}, ..., {"_id":"dish ObjectId"} ]
                let alreadyExists = false;

                for (var i = 0; i < (req.body.length); i++) {
                    for (var j = 0; j < (favorites.dishes.length); j++) {
                        if (req.body[i]._id == favorites.dishes[j]) { 
                            alreadyExists = true;

                            res.statusCode  = 403;
                            res.setHeader('Content-Type', 'text/plain');
                            res.end('The dish ' + req.body[i]._id + ' that you are trying to add to favorites is already in the favorites!');
                        }
                    }
                    if (!alreadyExists)
                    favorites.dishes.push(req.body[i]); 
                }
            }

            favorites.save() 
            .then(favorites => { // whenever we make changes to the favorites, we'll populate both the user and dishes and then send the favorites to the client - cause our React client expects them to be populated!
                    Favorites.findById(favorites._id) 
                    .populate('user')
                    .populate('dishes')
                    .then(favorites => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json'); 
                        res.json(favorites);
                    })
                },
                err => next(err) 
            );
        },
        err => next(err) 
    )
    .catch(err => next(err));    
})
.put(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => {
    res.statusCode  = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => {
    Favorites.remove({ user: req.user._id })
    .then(resp => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        },
        err => next(err) 
    )
    .catch(err => next(err));
});

favRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors,
    authenticate.verifyUser,
    (req, res, next) => {
        Favorites.findOne({ user: req.user._id }) 
        .then(favorites => {
            if (!favorites) {
                res.statusCode = 200; 
                res.setHeader('Content-Type', 'application/json');
                return res.json({ "exists": false, "favorites": favorites }); // the exists flag will be used by my client to check if this dish is part of his list of favorites. if I don't have any favorites, exists will be false. and then we return the favorites here (which would be null at this point)
            }
            else { 
                if (favorites.dishes.indexOf(req.params.dishId) < 0) { // if this specific dish is not in the list of his favorites, we again return "exists": false (but now favorites won't be null) 
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.json({ "exists": false, "favorites": favorites });
                }
                else { // if the user has a list of favorites and that dish is present there
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.json({ "exists": true, "favorites": favorites });
                }
            }
        },
        err => next(err)
        )
        .catch(err => next(err));
})
.post(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
        .then(favorites => {
            if (favorites == null) { 
                favorites = Favorites.create({ user: req.user._id });
            }
            
            let alreadyExists = false;
                for (var i = 0; i < (favorites.dishes.length); i++) { 
                    if (favorites.dishes[i] == req.params.dishId) {
                        alreadyExists = true;

                        res.statusCode  = 403;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('The dish ' + req.params.dishId + ' that you are trying to add to favorites is already in the favorites!');
                    }
                }
            if (!alreadyExists)
            favorites.dishes.push(req.params.dishId); 

            favorites.save() 
            .then(favorites => {
                Favorites.findById(favorites._id)
                .populate('user')
                .populate('dishes')
                .then(favorites => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json'); 
                    res.json(favorites);
                })
            },
            err => next(err) 
            );
        },
        err => next(err) 
    )
    .catch(err => next(err));
})
.put(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => {
        res.statusCode  = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})
.delete(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
        .then(favorites => {
            if (favorites == null || favorites.dishes == []) {
                res.statusCode  = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('The user ' + req.user + ' does not seem to have a list of favorites');
            }
            else {
                for (var i = 0; i < (favorites.dishes.length); i++) { 
                    if (favorites.dishes[i] == req.params.dishId) {
                        favorites.dishes.remove(req.params.dishId);
                    }
                }

                // alt can do sth like this: 
                // Favorites.findOneAndUpdate(
                //     { user: req.user._id },
                //     {
                //         $pull: {
                //             dishes: req.params.dishId,
                //         }
                //     }
                // )

                favorites.save()
                .then(favorites => {
                    Favorites.findById(favorites._id)
                    .populate('user')
                    .populate('dishes')
                    .then(favorites => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json'); 
                        res.json(favorites);
                    })
                    },
                    err => next(err) 
                );
            }
        },
        err => next(err) 
        )
        .catch(err => next(err));
});

module.exports = favRouter;