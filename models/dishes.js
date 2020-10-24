const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-currency').loadType(mongoose); 
const Currency = mongoose.Types.Currency;

const dishSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true 
        },
        description: {
            type: String,
            required: true
        },
        image: {
            type: String, 
            required: true
        },
        category: {
            type: String,
            required: true
        },
        label: {
            type: String,
            default: '' 
        },
        price: {
            type: Currency, // now the price of ex "1.99" will be stored as 199 (that's just how mongoose-currency stores the value of dollars)
            required: true,
            min: 0
        },
        featured: {
            type: Boolean,
            default: false
        },
        // comments: [ commentSchema ] // an array of objects of the type commentSchema. so every dish document can have multiple comments - and thus comments become sub-documents inside a dish document. -- NOTE: later removed the comments completely from the dishesSchema and moved them to a separate file - because now we want to integrate our server with our React client app, and not having subdocuments is in some ways easier in React. So now we'll store dishes and comments separate from each other
    },
    { 
        timestamps: true 
    }
);

var Dishes = mongoose.model('Dish', dishSchema); 

module.exports = Dishes;    