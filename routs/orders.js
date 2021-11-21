const { Router } = require('express');
const ordersController = require('../controllers/ordersController');
const shopController = require('../controllers/shopController');
const router = Router();
const Auth = require('../controllers/authorization');
const { param } = require('express-validator');


router.get('/orders', Auth.isLogin, Auth.onlyLogin, ordersController.loadOrderPage);

router.post('/products/buy/:id', [
    param('id')
        .escape()
], Auth.isLogin, Auth.onlyLogin, ordersController.addOrder);

router.post('/products/delete/:id', [
    param('id')
        .escape()
], Auth.isLogin, Auth.onlyAdmin, shopController.deleteProduct);

router.post('/orders/add/:id', [
    param('id')
        .escape()
], Auth.isLogin, Auth.onlyLogin, ordersController.addOrder);

router.post('/orders/remove/:id', [
    param('id')
        .escape()
], Auth.isLogin, Auth.onlyLogin, ordersController.removeOrder);

router.post('/orders/bought', Auth.isLogin, Auth.onlyLogin, ordersController.buyCart);

router.get('/bought', Auth.isLogin, Auth.onlyLogin, ordersController.loadCartPage);

router.get('/bought/:id', param('id').escape(), Auth.isLogin, Auth.onlyLogin, ordersController.downloadPDf);

module.exports = router;