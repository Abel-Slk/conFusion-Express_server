const express  = require('express'); 
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Comments = require('../models/comments');

const commentRouter = express.Router();

commentRouter.use(bodyParser.json());

commentRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors,
    (req, res, next) => {
        Comments.find(req.query)
        .populate('author') // we'll populate only author, and dishes we won't - cause when displaying comments we only need explicit author info
        .then(comments => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json'); 
            res.json(comments);
        },
        err => next(err) 
        )
        .catch(err => next(err));
}) 
.post(cors.corsWithOptions,
    authenticate.verifyUser, 
    (req, res, next) => {
        if (req.body != null) {
            req.body.author = req.user._id; // req.body will contain everything except for the author. the author field should not be filled by the user himself. And if we reach this point, the user has already logged in via authenticate.verifyUser, which will store the user info in req.user - so we can use that here
            // now req.body contains everything necessary - so we can create a comment:
            Comments.create(req.body)
            .then(comment => {
                Comments.findById(comment._id) 
                .populate('author')
                .then(comment => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json'); 
                    res.json(comment);
                })
            },
            err => next(err) 
            )
            .catch(err => next(err));
        }
        else {
            err = new Error('Comment not found in request body');
            err.status = 404;
            return next(err);
        }
})
.put(cors.corsWithOptions,
    authenticate.verifyUser, (req, res, next) => {
    res.statusCode  = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('PUT operation not supported on /comments/');
})
.delete(cors.corsWithOptions,
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
        Comments.remove({})
        .then(resp => { 
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json'); 
            res.json(resp);
        },
        err => next(err) 
        )
        .catch(err => next(err));
});

commentRouter.route('/:commentId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors,
    (req, res, next) => {
    Comments.findById(req.params.commentId)
    .populate('author')
    .then(comment => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json'); 
        res.json(comment);
    },
    err => next(err)
    )
    .catch(err => next(err));
})
.post(cors.corsWithOptions,
    authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('POST operation not supported on /comments/' + req.params.commentId);
})
.put(cors.corsWithOptions,
    authenticate.verifyUser, (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then(comment => {
        if (comment != null) {
            if (!comment.author.equals(req.user._id)) { // we'll allow updating or deleting a comment only to the user who posted it. equals() is used to compare strings
                res.statusCode = 403;
                res.setHeader('Content-Type', 'text/plain');
                res.end('You are not allowed to update this comment. Only the author of this comment can update it');
            }
            // if the above code is not executed, then this is the correct user
            req.body.author = req.user._id; // even though the author is not changing, we need this line just cause below we're updating the comment by rewriting it completely in { $set: req.body } - so we'll need to include the author again
            Comments.findByIdAndUpdate(req.params.commentId, 
                { $set: req.body }, 
                { new: true } 
            ) 
            .then(comment => { 
                Comments.findById(comment._id)
                .populate('author')
                .then(comment => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json'); 
                    res.json(comment);
                })
            },
            err => next(err) 
            );
        } 
        else { 
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);
        }
    },
    err => next(err)
    )
    .catch(err => next(err));
    
})
.delete(cors.corsWithOptions,
    authenticate.verifyUser, (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then(comment => { 
            if (comment != null) {
                if (!comment.author.equals(req.user._id)) {
                    var err = new Error('You are not allowed to delete this comment. Only the author of this comment can delete it');
                    err.status = 403;
                    return next(err);
                }
                // otherwise:
                Comments.findByIdAndRemove(req.params.commentId) 
                .then(resp => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json'); 
                        res.json(resp);
                    },
                    err => next(err) 
                )
                .catch(err => next(err));
            } 
            else { 
                err = new Error('Comment ' + req.params.commentId + ' not found');
                err.status = 404;
                return next(err);
            }
        },
        err => next(err) 
    )
    .catch(err => next(err));
});

module.exports = commentRouter;
