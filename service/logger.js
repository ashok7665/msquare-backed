const winston = require('winston');


const logger = (_filename)=>{

    const date = new Date();
    const day=  date.getDate()
    const month = date.getMonth();
    _filename  = "logs/"+day+"_"+month+"_"+_filename;

    const loggerLib = winston.createLogger({
        //level: 'info',
        format: winston.format.combine(
        
            winston.format.timestamp({
               format: 'MMM-DD-YYYY HH:mm:ss'
           }),
            winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
        ),
        //defaultMeta: { service: 'user-service' },
        transports: [
          //
          // - Write all logs with importance level of `error` or less to `error.log`
          // - Write all logs with importance level of `info` or less to `combined.log`
          //
          //new winston.transports.File({ filename: 'error.log', level: 'error' }),
          new winston.transports.File({ filename: _filename+'.log' }),
        ],
      });
    
      return loggerLib;
}


module.exports.logger = logger;

  