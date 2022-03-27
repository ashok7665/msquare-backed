let { SmartAPI, WebSocket } = require("smartapi-javascript");
const tradesModel = require('../db/trades')
const moment = require('moment')
const {fetcClient,emitData} = require('../socket_manager')
const {fetchSelectedStock,updateSellStatus,updateBuyStatus} =require('./mongo_service')


let web_socket = undefined;
var tradesMap = {}
var map = {}


module.exports.startTickWebsocket = async ()=>{
    console.log('starting ..... ')
    var date = moment().format('YYYY-MM-DD');

    const scripts = [];
    const tradesList = await fetchSelectedStock(date)
    tradesList.forEach(m=>{
        tradesMap[m['symbol_token']] = m;
        scripts.push(m['symbol_token'])
    })

    console.log(tradesList)

    if(web_socket){
        web_socket.close()
    }

    let smart_api = new SmartAPI({
        api_key: "TWOFZgdZ",
    });


    var session = await smart_api.generateSession("A201547","Ashok7665@")
    var feedToken = session.data.feedToken;
    var clientCode = smart_api.client_code

    web_socket = new WebSocket({
        client_code: clientCode,   
        feed_token: feedToken
    });

    web_socket.connect()
        .then(() => {
            var str = "";
            var divider = ""
            scripts.forEach(element => {
                str+=divider + "nse_cm|"+element
                divider = "&"
            });

            console.log(str)
            web_socket.runScript(str, "mw")
            
        })

    web_socket.on('tick', receiveTick)
    web_socket.on('error', (e)=>{console.log(e)})


    var lastSync = 5
    function receiveTick(data) {

        for(element of data){
            if(!element['tk'] || !element['ltp'])
                continue
            map[element['tk']] = element['ltp']
        }

        if(lastSync>0){
            lastSync -=1;
            return
        }
            
        
        lastSync = 5;
        

        emitData(map)
        checkTradeData()
    }


    async function checkTradeData(){

        for(tradingToken of Object.keys(map)){
            const stock = tradesMap[tradingToken]
            
            const ltp = Number.parseFloat(map[tradingToken])
            const buyPrice = Number.parseFloat(stock.buy_order['buy_price'])
            const sellPrice = Number.parseFloat(stock.sell_order['sell_price'])
            const _id = stock['_id']

            if(buyPrice<=ltp && stock.buy_order['status'] == 'pending'){
                console.log(`[${date}] [${stock['trading_symbol']}] [BUY] [${buyPrice}] [${ltp}]`)
                stock.buy_order['status'] = 'order_executed';
                tradesMap[tradingToken] = stock;

                await updateBuyStatus(_id,'order_executed')
            }

            else if(stock.buy_order['status'] == 'order_executed'){
                const buyOrder = stock.buy_order;

                if(ltp>= buyOrder['target']){
                    
                    console.log(`[${date}] [${stock['trading_symbol']}] [TARGET HIT - BUY] [${buyOrder['target']}] [${ltp}]`)
                    buyOrder['status'] = 'target_hit'
                    stock['buy_order'] = buyOrder;
                    tradesMap[tradingToken] = stock;
                    await updateBuyStatus(_id,'target_hit')
                }
                if(ltp <= buyOrder['sl']){
                    console.log(`[${date}] [${stock['trading_symbol']}] [SL HIT - BUY] [${buyOrder['sl']}] [${ltp}]`)
                    buyOrder['status'] = 'sl_hit'
                    stock['buy_order'] = buyOrder;
                    tradesMap[tradingToken] = stock;
                    await updateBuyStatus(_id,'sl_hit')
                }

            }
                

            else if(sellPrice>=ltp && stock.sell_order['status'] != 'pending'){
                console.log(`[${date}] [${stock['trading_symbol']}] [SELL] [${sellPrice}] [${ltp}]`)
                stock.sell_order['status'] = 'order_executed';
                tradesMap[tradingToken] = stock;
                await updateSellStatus(_id,'order_executed')
            }

            else if(stock.sell_order['status'] == 'order_executed'){
                const sellOrder = stock.sell_order;

                if(ltp<= sellOrder['target']){
                    console.log(`[${date}] [${stock['trading_symbol']}] [TARGET HIT - BUY] [${sellOrder['target']}] [${ltp}]`)
                    sellOrder['status'] = 'target_hit'
                    stock['buy_order'] = sellOrder;
                    tradesMap[tradingToken] = stock;
                    await updateSellStatus(_id,'target_hit')
                }
                if(ltp >= sellOrder['sl']){
                    console.log(`[${date}] [${stock['trading_symbol']}] [SL HIT - BUY] [${sellOrder['sl']}] [${ltp}]`)
                    sellOrder['status'] = 'sl_hit'
                    stock['buy_order'] = sellOrder;
                    tradesMap[tradingToken] = stock;
                    
                    await updateSellStatus(_id,'sl_hit')
                }

            }

        }
    }

}

module.exports.closeWebSocket = ()=>{

    console.log('closing ..... ')
    tradesMap = {}
    map = {}
    if(web_socket){
        web_socket.close()
        web_socket = undefined;
    }
}

