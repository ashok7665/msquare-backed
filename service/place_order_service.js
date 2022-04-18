const tradesModel = require('../db/trades')
const moment = require('moment')
const {fetcClient,emitData} = require('../socket_manager')
const {fetchSelectedStock,updateSellStatus,updateBuyStatus} =require('./mongo_service')
const {webSocketInstance,placeOrder,login} = require('./angle_api_service')
const { response } = require('../app')

const timer = ms => new Promise(res => setTimeout(res, ms))

const placeOrders = async()=>{

    var date = moment().format('YYYY-MM-DD');
    scriptsList = [];
    const tradesList = await fetchSelectedStock(date)

    const session = login()
    for(stock of tradesList){
        await timer(500)
        console.log(stock)

        var symbolToken = stock['symbol_token']
        var tradingSymbol = stock['trading_symbol']
        var buyOrder = stock['buy_order']
        var sellOrder = stock['sell_order']

        const response = await placeOrder({
                    symbol:tradingSymbol,
                    token:symbolToken,
                    type:'BUY',
                    target:buyOrder['target'],
                    stoploss:buyOrder['sl'],
                    quantity:1,
                    triggerprice:buyOrder['buy_price']
        })


        const sellResponse  = await placeOrder({
            symbol:tradingSymbol,
            token:symbolToken,
            type:'SELL',
            target:sellOrder['target'],
            stoploss:sellOrder['sl'],
            quantity:1,
            triggerprice:sellOrder['sell_price']
        })
    }

    console.log(sellResponse)
}

module.exports.placeOrders= placeOrders;