const express = require('express');
const cors = require('cors');

const app = express();

const whitelist = ['http://localhost:3000', 'https://localhost:3443', 'http://localhost:3001/']; // the origins that this server is willing to accept
// for our React client app, if we start it up with the yarn start command, it runs at 'computer name:3001'. this is the origin from which my client will be originating the requests that come to this server. So I am going to add that into my whitelist so that my CORS would not cause problems for my client

var corsOptionsDelegate = (req, callback) => { // checks if the incoming request belongs to one of the whitelisted origins
    var corsOptions;

    if (whitelist.indexOf(req.header('Origin')) !== -1) { // req.header('Origin') finds the header named Origin and returns its value, which will be some URL. And then we check if we have that URL in our whitelist. (In Postman we'll need to include an Origin header in the request ourselves - and as its value we'll type https://localhost:3443. And if we ex say instead https://localhost:2000, then the response won't contain among headers the header access-control-allow-origin)
        corsOptions = { origin: true }; // meaning that the origin in the request IS in the whitelist. So I will allow it to be accepted. then my cors module will reply back saying "access-control-allow-origin: thatOrigin", and then include that origin into the headers with the access-control-allow-origin key there. So that way my client side will be informed saying it's okay for the server to accept this request for this particular origin
    }
    else {
        corsOptions = { origin: false }; // this way the access-control-allow-origin header won't be returned by my server side
    }
    callback(null, corsOptions);
};

exports.cors = cors();  
// cors() without any options makes it reply back with access-control-allow-origin with * (all allowed). In certain cases this is acceptable to do, especially when we perform GET operations. Otherwise, if you need to apply a cors with specific options to a particular route, we will use this:
exports.corsWithOptions = cors(corsOptionsDelegate);
// we'll use exports.cors for for all the GET requests, and exports.corsWithOptions for POST, PUT, DELETE requests - so for the GET requests any origins will be allowed, and for other requests only the origins in our whitelist will be allowed

