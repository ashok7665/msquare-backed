
const mongoose = require('mongoose');
const Float = require('mongoose-float').loadType(mongoose);

const schema = mongoose.Schema({
    'trading_symbol': String,
    'symbol_token': String,
    'date': String,
    'status': String,
    'buy_order': {
        buy_price:Float,
        target:Float,
        sl:Float,
        quantity:Number,
        status:String
    },
    'sell_order': {
        sell_price:Float,
        target:Float,
        sl:Float,
        quantity:Number,
        status:String
    },
}, {
    timestamps:true,
    "versionKey": false
});


module.exports = mongoose.model('trades', schema, 'trades');
