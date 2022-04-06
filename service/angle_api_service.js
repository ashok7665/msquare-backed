let { SmartAPI, WebSocket } = require("smartapi-javascript");

let smartApi = new SmartAPI({
    api_key: "TWOFZgdZ",
});

async function login(){
   return await smartApi.generateSession("P246447", "Pljangir34@")
}

module.exports.webSocketInstance = async ()=>{
    var session = await login();
    var feedToken = session.data.feedToken;
    var clientCode = smartApi.client_code

    var websocket = new WebSocket({
        client_code: clientCode,   
        feed_token: feedToken
    });
    
    return websocket;
}

//       //     "price":"194.50",
module.exports.placeOrder  = async (params) =>{
   return  await smartApi.placeOrder(
        {
            "variety":"ROBO",
            "tradingsymbol":params['symbol'],
            "symboltoken":params['token'],
            "transactiontype":params['type'],
            "exchange":"NSE",
            "ordertype":"MARKET",
            "producttype":"BO",
            "duration":"DAY",
            "squareoff":params['target'], //target 
            "stoploss":params['stoploss'],
            "quantity":params['quantity']
            }
    )
}