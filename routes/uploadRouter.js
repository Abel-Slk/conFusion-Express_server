const express  = require('express'); 
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const multer = require('multer'); 
const cors = require('./cors');

const storage = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, 'public/images'); 
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname) 
    }
}); 

const imageFileFilter = (req, file, cb) => { // specify which kind of files I accept for uploading
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) { // file.originalname is of type string, so we can use match() on it. if the file's extension contains jpg or jpeg or png or gif, then I will treat that as an image file and accept that
        return cb(new Error('You can upload only image files!'), false); 
    }
    cb(null, true); // else let it be uploaded
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter });

const uploadRouter = express.Router();

uploadRouter.use(bodyParser.json());

uploadRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors,
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('GET operation not supported on /imageUpload');
})
.post(cors.corsWithOptions,
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    upload.single('imageFile'), // we insert here this middleware which allows to upload only a single file here, and it's supposed to receive the file from the 'imageFile' form field in the request
    (req, res) => { 
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(req.file); 

})
.put(cors.corsWithOptions,
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('PUT operation not supported on /imageUpload');
})
.delete(cors.corsWithOptions,
    authenticate.verifyUser, 
    (req, res, next) => { authenticate.verifyAdmin(req, next); }, 
    (req, res, next) => {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('DELETE operation not supported on /imageUpload');
})


module.exports = uploadRouter;