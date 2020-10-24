const express  = require('express'); 
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Dishes = require('../models/dishes');

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/') 
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
}) 
.get(cors.cors, 
    (req, res, next) => {
        Dishes.find(req.query) 
        .populate('comments.author')
        .then(dishes => { 
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dishes);
            },
            err => next(err)
        )
        .catch(err => next(err));
}) 
.post(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => { 
// we'll allow to POST dishes only to admin users. So we first authenticate the user via authenticate.verifyUser, and if successful, then the callback in the second param will get executed to check if the user has admin rights. If successful, then the callback in the 3rd param will get executed to actually post a dish.

    Dishes.create(req.body)
    .then(dish => {
            console.log('Dish Created ', dish); 

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish); 
        },
        err => next(err) 
    )
    .catch(err => next(err));
})
.put(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('PUT operation not supported on /dishes'); 
})
.delete(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
        Dishes.remove({})
        .then(resp => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp); 
            },
            err => next(err) 
        )
        .catch(err => next(err));
});

dishRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors,
    (req,res,next) => {
    Dishes.findById(req.params.dishId) 
    .populate('comments.author')
    .then(dish => {
            if (dish != null) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json'); 
                res.json(dish);
            } 
            else {
                err = new Error('Dish ' + req.params.dishId + ' not found');
                err.status = 404;
                return next(err); 
            }
        },
        err => next(err)
    )
    .catch(err => next(err));
})
.post(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('POST operation not supported on /dishes/'+ req.params.dishId); 
})
.put(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
    Dishes.findByIdAndUpdate(req.params.dishId, 
        { 
            $set: req.body // everything necessary for the update will be in req.body
        },
        { 
            new: true
        }
    )
    .then(dish => {
            if (dish != null) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);
            }
            else {
                err = new Error('Dish ' + req.params.dishId + ' not found');
                err.status = 404;
                return next(err);
            }
        },
        err => next(err)
    )
    .catch(err => next(err));
})
.delete(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
    Dishes.findByIdAndRemove(req.params.dishId)
    .then(resp => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        },
        err => next(err) 
    )
    .catch(err => next(err));
});

module.exports = dishRouter;