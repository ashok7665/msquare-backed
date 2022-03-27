
let { SmartAPI, WebSocket } = require("smartapi-javascript");
const tradesModel = require('../db/trades')
let web_socket = undefined;
const moment = require('moment')
var tradesMap = {}


module.exports.fetchSelectedStock = async(date)=>{
    const tradesList = await tradesModel.find({"$or":[{status: 'order_selected'}, {status: 'order_trigged'}],date:date})
    return tradesList;
}

module.exports.updateBuyStatus = async(_id, status)=>{
    await tradesModel.updateOne({_id:_id},{
        "status":'order_trigged',
        "buy_order.status":status
    })
}

module.exports.updateSellStatus = async(_id, status)=>{
    await tradesModel.updateOne({_id:_id},{
        "status":'order_trigged',
        "sell_order.status":status
    })
}