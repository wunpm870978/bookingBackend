var express = require('express');
var router = express.Router();
var accountRouter = require('./account/account');
var shopRouter = require('./shop/shop');
const { authMeMiddleware } = require('../action/auth')

/* GET home page. */
// router.get('/', function (req, res, next) {
//   res.render('index', { title: 'Express' });
// });

router.use(authMeMiddleware)
router.use('/account', accountRouter);
router.use('/shop', shopRouter);

module.exports = router;
