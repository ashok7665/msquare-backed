var cron = require('node-cron');
const {startTickWebsocket,closeWebSocket,}  =require('./service/stock_tick_service')
const {placeOrders} = require('./service/place_order_service')
cron.schedule('00 46 09 * * 1-5', () => {
   // placeOrders()
    startTickWebsocket()
});

cron.schedule('00 15 15 * * 1-5', () => {
    closeWebSocket()
  });
  
  