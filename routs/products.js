const { Router } = require('express');
const shopController = require('../controllers/shopController');
const router = Router();
const Auth = require('../controllers/authorization');
const { query } = require('express-validator');

router.get('/products', query('page').escape().isNumeric(), Auth.isLogin, shopController.loadProductPage);

router.get('/products/:id', Auth.isLogin, shopController.loadCartPage);

module.exports = router;