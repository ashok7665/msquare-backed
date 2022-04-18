var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config()
const connection = require('./db/index')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const socketManager = require('./socket_manager')
const stockService = require('./service/stock_tick_service')

var app = express();
const cron = require('./cron')
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


//stockService.startTickWebsocket()
module.exports = app;
