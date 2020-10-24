const express  = require('express'); 
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Promotions = require('../models/promotions');

const promoRouter = express.Router();

promoRouter.use(bodyParser.json());

promoRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors,
    (req, res, next) => {
    Promotions.find(req.query) 
    .then(promos => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(promos);
        },
        err => next(err)
    )
    .catch(err => next(err));
}) 
.post(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
    Promotions.create(req.body)
    .then(promo => {
            console.log('Promotion Created ', promo);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(promo);
        },
        err => next(err) 
    )
    .catch(err => next(err));
})
.put(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
    res.statusCode  = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('PUT operation not supported on /promotions');
})
.delete(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
    Promotions.remove({})
    .then(resp => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        },
        err => next(err) 
    )
    .catch(err => next(err));
});

promoRouter.route('/:promoId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors,
    (req, res, next) => {
    Promotions.findById(req.params.promoId)
    .then(promo => {
            if (promo != null) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json'); 
                res.json(promo);
            } 
            else {
                err = new Error('Promotion ' + req.params.promoId + ' not found');
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
    res.end('POST operation not supported on /promotions/'+ req.params.promoId);
})
.put(cors.corsWithOptions, 
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
    Promotions.findByIdAndUpdate(req.params.promoId, 
        {
            $set: req.body
        },
        { 
            new: true 
        }
    )
    .then(promo => {
            if (promo != null) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(promo);
            }
            else {
                err = new Error('Promotion ' + req.params.promoId + ' not found');
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
    Promotions.findByIdAndRemove(req.params.promoId)
    .then(resp => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        },
        err => next(err) 
    )
    .catch(err => next(err));
});

module.exports = promoRouter;