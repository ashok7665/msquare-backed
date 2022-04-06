// Importing the required modules
const WebSocketServer = require('ws');
 

var client = undefined;


module.exports.fetcClient = ()=>{
    return client;
}




module.exports.emitData = (data)=>{
    //console.log('emitting')
    if(client){
       // console.log('sending...')
        var emited = client.send(JSON.stringify(data))
        console.log(emited)
    }
}



// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: 8080 })
 
// Creating connection using websocket
wss.on("connection", ws => {
    client = ws;
    
    // sending message
    ws.on("message", data => {
        console.log(`Client has sent us: ${data}`)
    });
    // handling what to do when clients disconnects from server
    ws.on("close", () => {
        client = undefined;
        console.log("the client has connected");
    });
    // handling client connection error
    ws.onerror = function () {
        console.log("Some Error occurred")
    }
});
console.log("The WebSocket server is running on port 8080");