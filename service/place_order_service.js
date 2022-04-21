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

    const session = await login()
    for(stock of tradesList){
        await timer(500)
        console.log(stock)

        var symbolToken = stock['symbol_token']
        var tradingSymbol = stock['trading_symbol']
        console.log(tradingSymbol,symbolToken)
        var buyOrder = stock['buy_order']
        var sellOrder = stock['sell_order']

        const response = await placeOrder({
                    symbol:tradingSymbol,
                    token:symbolToken,
                    type:'BUY',
                    target:(buyOrder['target'] -buyOrder['buy_price']).toFixed(2),
                    stoploss: (buyOrder['buy_price'] - buyOrder['sl']).toFixed(2),
                    quantity:1,
                    triggerprice:buyOrder['buy_price']
        })
        console.log(response)


        const sellResponse  = await placeOrder({
            symbol:tradingSymbol,
            token:symbolToken,
            type:'SELL',
            target:(sellOrder['sell_price'] - sellOrder['target']).toFixed(2) ,
            stoploss: (sellOrder['sl'] - sellOrder['sell_price']).toFixed(2),
            quantity:1,
            triggerprice:sellOrder['sell_price']
        })
    }

}




module.exports.placeOrders= placeOrders;