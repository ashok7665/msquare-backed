let { SmartAPI, WebSocket } = require("smartapi-javascript");

let smartApi = new SmartAPI({
    api_key: "ilgUlOtU",
});




async function login(){
   return await smartApi.generateSession("P246447", "Jangir76@")
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

    const order = {
        "variety":params['variety'], //NORMAL, STOPLOSS
        "tradingsymbol":params['symbol'],
        "symboltoken":params['token'],
        "transactiontype":params['type'],
        "exchange":"NSE",
        "ordertype":params['ordertype'],
        "producttype":"INTRADAY",
        "duration":"DAY",
        "triggerprice":params['triggerprice'],
        "quantity":params['quantity'],
        }

     //   console.log(order);

//    return  await smartApi.placeOrder(
//        order
//     )
}

module.exports.login = login;