
let { SmartAPI, WebSocket } = require("smartapi-javascript");
const tradesModel = require('../db/trades')
let web_socket = undefined;
const moment = require('moment')
var tradesMap = {}



//"$or":[{status: 'order_selected'}, {status: 'order_trigged'}]
module.exports.fetchSelectedStock = async(date)=>{
    const tradesList = await tradesModel.find({date:date})
    return tradesList;
}


module.exports.clearCPRData = async(date)=>{
    const tradesList = await tradesModel.deleteMany({date:date})
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