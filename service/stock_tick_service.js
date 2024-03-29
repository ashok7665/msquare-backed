const tradesModel = require('../db/trades')
const moment = require('moment')
const {fetcClient,emitData} = require('../socket_manager')
const {fetchSelectedStock,updateSellStatus,updateBuyStatus,clearCPRData} =require('./mongo_service')
const {webSocketInstance,placeOrder} = require('./angle_api_service')
const witsenLogger = require('./logger').logger;

let webSocket = undefined;
var tradesMap = {}
var map = {}
var lastSync = 5
var scriptsList= [];
var lastTickTime = undefined;
var webSocketRunning  = false;


const connectionCallback = ()=>{
    
    var nowtime = new Date().getTime();
    if(webSocketRunning && lastTickTime && nowtime - lastTickTime > 10000){
        witsenLogger('connection').info('connection was clonsed! Starting again')
        //console.log('connection was clonsed! Starting again')
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
    await clearCPRData(date)
    const tradesList = await fetchSelectedStock(date)
    // console.log(tradesList)
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
   
    witsenLogger('connection').info('connected to websocket')
    console.log('connected to websocket')
    webSocket.on('tick', receiveTick)
    webSocket.on('error', (e)=>{
        witsenLogger('connection').info('Connect error')
        console.log('websocet connection error start ---->')
        console.log(e)
        console.log('websocet connection error end ---->')
    })
    webSocket.runScript(scriptsStr(scriptsList), "mw")

    //makeOrder();

}


function receiveTick(data) {
    lastTickTime = new Date().getTime();
    if(lastSync>0){
        lastSync -=1;
        return
    }

    lastSync = 2;


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

        var logger = witsenLogger(stock['trading_symbol'])
        logger.info(ltp)


       
        if(buyPrice<=ltp && stock.buy_order['status'] == 'pending'){
            logger.info(`[BUY] [${buyPrice}] [${ltp}]`)
            //console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [BUY] [${buyPrice}] [${ltp}]`)
            stock.buy_order['status'] = 'order_executed';
            tradesMap[tradingToken] = stock;

            // const response = await placeOrder({
            //     variety:'NORMAL',
            //     symbol:stock['trading_symbol'],
            //     token:stock['symbol_token'],
            //     ordertype:'MARKET',
            //     type:'BUY',
            //     quantity:1,
            // })

            // console.log(response)

            // const sl_response = await placeOrder({
            //     variety:'STOPLOSS',
            //     symbol:stock['trading_symbol'],
            //     token:stock['symbol_token'],
            //     ordertype:'STOPLOSS_MARKET',
            //     type:'SELL',
            //     quantity:1,
            //     triggerprice:stock.buy_order['sl']
            // })

           // console.log(sl_response)
            await updateBuyStatus(_id,'order_executed')
        
        }

        else if(stock.buy_order['status'] == 'order_executed'){
            const buyOrder = stock.buy_order;

            if(ltp>= buyOrder['target']){
                logger.info(`[TARGET HIT - BUY] [${buyOrder['target']}] [${ltp}]`)

                // const response = await placeOrder({
                //     variety:'NORMAL',
                //     symbol:stock['trading_symbol'],
                //     token:stock['symbol_token'],
                //     ordertype:'MARKET',
                //     type:'SELL',
                //     quantity:1,
                // })

                //console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [TARGET HIT - BUY] [${buyOrder['target']}] [${ltp}]`)
                buyOrder['status'] = 'target_hit'
                stock['buy_order'] = buyOrder;
                tradesMap[tradingToken] = stock;
                await updateBuyStatus(_id,'target_hit')
            }
            if(ltp <= buyOrder['sl']){
                logger.info(`[SL HIT - BUY] [${buyOrder['sl']}] [${ltp}]`)
                //console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [SL HIT - BUY] [${buyOrder['sl']}] [${ltp}]`)
                buyOrder['status'] = 'sl_hit'
                stock['buy_order'] = buyOrder;
                tradesMap[tradingToken] = stock;
                await updateBuyStatus(_id,'sl_hit')
            }
        }
            

        else if(sellPrice>=ltp && stock.sell_order['status'] == 'pending'){

            logger.info(`[SELL] [${sellPrice}] [${ltp}]`)


           // console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [SELL] [${sellPrice}] [${ltp}]`)
            stock.sell_order['status'] = 'order_executed';
            tradesMap[tradingToken] = stock;

            // const response = await placeOrder({
            //     variety:'NORMAL',
            //     symbol:stock['trading_symbol'],
            //     token:stock['symbol_token'],
            //     ordertype:'MARKET',
            //     type:'SELL',
            //     quantity:1,
            // })

           // console.log(response)

            // const sl_response = await placeOrder({
            //     variety:'STOPLOSS',
            //     symbol:stock['trading_symbol'],
            //     token:stock['symbol_token'],
            //     ordertype:'STOPLOSS_MARKET',
            //     type:'BUY',
            //     quantity:1,
            //     triggerprice:stock.sell_order['sl']
            // })

            await updateSellStatus(_id,'order_executed')
        }

        else if(stock.sell_order['status'] == 'order_executed'){
            const sellOrder = stock.sell_order;

            if(ltp<= sellOrder['target']){

                logger.info(`[TARGET HIT - SELL] [${sellOrder['target']}] [${ltp}]`)


               // console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [TARGET HIT - BUY] [${sellOrder['target']}] [${ltp}]`)
                sellOrder['status'] = 'target_hit'
                stock['sell_order'] = sellOrder;
                tradesMap[tradingToken] = stock;

                // const response = await placeOrder({
                //     variety:'NORMAL',
                //     symbol:stock['trading_symbol'],
                //     token:stock['symbol_token'],
                //     ordertype:'MARKET',
                //     type:'BUY',
                //     quantity:1,
                // })



                await updateSellStatus(_id,'target_hit')
            }
            if(ltp >= sellOrder['sl']){
                logger.info(`[SL HIT - SELL] [${sellOrder['sl']}] [${ltp}]`)
                //console.log(`[${new Date().toLocaleDateString()}] [${stock['trading_symbol']}] [SL HIT - BUY] [${sellOrder['sl']}] [${ltp}]`)
                sellOrder['status'] = 'sl_hit'
                stock['sell_order'] = sellOrder;
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
    
    // const response = await placeOrder({
    //     variety:'NORMAL',
    //     symbol:'ACC-EQ',
    //     token:22,
    //     ordertype:'MARKET',
    //     type:'BUY',
    //     quantity:1,
    // })

    // console.log(response)
    

    // const response1 = await placeOrder(
    //     {   variety:'STOPLOSS',
    //         symbol:'ACC-EQ',
    //         token:22,
    //         type:'SELL',
    //         quantity:1,
    //         ordertype:'STOPLOSS_MARKET',
    //         triggerprice:2250.00
    //     }
    // )

    // console.log(response1)
}

