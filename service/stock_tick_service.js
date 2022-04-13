const tradesModel = require('../db/trades')
const moment = require('moment')
const {fetcClient,emitData} = require('../socket_manager')
const {fetchSelectedStock,updateSellStatus,updateBuyStatus} =require('./mongo_service')
const {webSocketInstance,placeOrder} = require('./angle_api_service')

let webSocket = undefined;
var tradesMap = {}
var map = {}
var lastSync = 5
var scriptsList= [];
var lastTickTime = undefined;
var webSocketRunning  = false;


const connectionCallback = ()=>{
    console.log('checking connection')
    var nowtime = new Date().getTime();
    console.log(webSocketRunning, lastTickTime,nowtime - lastTickTime)
    if(webSocketRunning && lastTickTime && nowtime - lastTickTime > 10000){
        console.log('connection was clonsed! Starting again')
        clearInterval(connectionCallback)
        startTickWebsocket()
    }
}


function checkConnection(){
    setInterval(connectionCallback,15000)
}


async function initScrips(){
    var date = moment().format('YYYY-MM-DD');
    scriptsList = [];
    const tradesList = await fetchSelectedStock(date)
    tradesList.forEach(m=>{
        tradesMap[m['symbol_token']] = m;
        scriptsList.push(m['symbol_token'])
    })
  
}



function scriptsStr(){
   
    var str = "";
    var divider = ""
    scriptsList.forEach(element => {
                str+=divider + "nse_cm|"+element
                divider = "&"
            });
    return str;
}


const startTickWebsocket = async ()=>{
    
    const time = new Date()
    console.log('\nstart ---> ',time.toString(), '<----------')
    if(webSocket) webSocket.close()
    webSocketRunning = true
    checkConnection()
    await initScrips()
    
    webSocket = await webSocketInstance()
    await webSocket.connect();
   
    console.log('connected to websocket')
    webSocket.on('tick', receiveTick)
    webSocket.on('error', (e)=>{
        console.log('websocet connection error start ---->')
        console.log(e)
        console.log('websocet connection error end ---->')
    })
    webSocket.runScript(scriptsStr(scriptsList), "mw")


}


function receiveTick(data) {
    lastTickTime = new Date().getTime();
    if(lastSync>0){
        lastSync -=1;
        return
    }

    lastSync = 5;


    //console.log('TICK \n', data)
    for(element of data){
        if(!element['tk'] || !element['ltp'])
            continue
        map[element['tk']] = element['ltp']
    }
    

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
            console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [BUY] [${buyPrice}] [${ltp}]`)
            stock.buy_order['status'] = 'order_executed';
            tradesMap[tradingToken] = stock;
            await placeOrder(
                {
                    symbol:stock['trading_symbol'],
                    token:stock['symbol_token'],
                    type:'BUY',
                    target:stock.buy_order['target'],
                    stoploss:stock.buy_order['sl'],
                    quantity:1,
                    triggerprice:ltp+1
                }
            )

            await updateBuyStatus(_id,'order_executed')
        
        }

        else if(stock.buy_order['status'] == 'order_executed'){
            const buyOrder = stock.buy_order;

            if(ltp>= buyOrder['target']){
                
                console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [TARGET HIT - BUY] [${buyOrder['target']}] [${ltp}]`)
                buyOrder['status'] = 'target_hit'
                stock['buy_order'] = buyOrder;
                tradesMap[tradingToken] = stock;
                await updateBuyStatus(_id,'target_hit')
            }
            if(ltp <= buyOrder['sl']){
                console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [SL HIT - BUY] [${buyOrder['sl']}] [${ltp}]`)
                buyOrder['status'] = 'sl_hit'
                stock['buy_order'] = buyOrder;
                tradesMap[tradingToken] = stock;
                await updateBuyStatus(_id,'sl_hit')
            }
        }
            

        else if(sellPrice>=ltp && stock.sell_order['status'] != 'pending'){
            console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [SELL] [${sellPrice}] [${ltp}]`)
            stock.sell_order['status'] = 'order_executed';
            tradesMap[tradingToken] = stock;
            await placeOrder(
                {
                    symbol:stock['trading_symbol'],
                    token:stock['symbol_token'],
                    type:'SELL',
                    target:stock.sell_order['target'],
                    stoploss:stock.sell_order['sl'],
                    quantity:1,
                    triggerprice:ltp-1
                }
            )

            await updateSellStatus(_id,'order_executed')
        }

        else if(stock.sell_order['status'] == 'order_executed'){
            const sellOrder = stock.sell_order;

            if(ltp<= sellOrder['target']){
                console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [TARGET HIT - BUY] [${sellOrder['target']}] [${ltp}]`)
                sellOrder['status'] = 'target_hit'
                stock['buy_order'] = sellOrder;
                tradesMap[tradingToken] = stock;
                await updateSellStatus(_id,'target_hit')
            }
            if(ltp >= sellOrder['sl']){
                console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [SL HIT - BUY] [${sellOrder['sl']}] [${ltp}]`)
                sellOrder['status'] = 'sl_hit'
                stock['buy_order'] = sellOrder;
                tradesMap[tradingToken] = stock;
                
                await updateSellStatus(_id,'sl_hit')
            }
        }


    }
}

module.exports.closeWebSocket = ()=>{
    if(webSocket) webSocket.close()
    webSocket = undefined;
    webSocketRunning = false;
    lastTickTime = undefined
    scriptsList= []
    tradesMap = {}
    map = {}
    clearInterval(connectionCallback)
}


module.exports.startTickWebsocket = startTickWebsocket;



async function makeOrder (){
    console.log('makeOrder')
    const response = await placeOrder(
        {
            symbol:'AMARAJABAT-EQ',
            token:100,
            type:'BUY',
            target:571.70,
            stoploss:571.15,
            quantity:1,
            triggerprice:571.30
        }
    )

    console.log(response)
}

