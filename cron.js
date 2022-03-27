var cron = require('node-cron');
const {startTickWebsocket,closeWebSocket}  =require('./service/stock_tick_service')

cron.schedule('00 47 09 * * 1-5', () => {
    startTickWebsocket()
});

cron.schedule('00 10 15 * * 1-5', () => {
    closeWebSocket()
  });
  
  