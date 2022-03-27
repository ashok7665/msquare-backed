var express = require('express');
var router = express.Router();
const tradesModel = require('../db/trades')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/trades', async (req,res)=>{
  const date = req.query.date;
  try{
    const tradesList = await tradesModel.find({'date':date}).sort({updatedAt:1})
    res.status(200).json(tradesList)
  }catch(e){
    res.status(500).json({message:'Something went wrong'})
    console.error(e)
  }
})

module.exports = router;
