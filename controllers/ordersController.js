const OrderItem = require('../models/orderItem');
const Product = require('../models/product');
const User = require('../models/user');
const OrderedProducts = require('../models/orderedProducts');
const Cart = require('../models/cart');
const Info = require('../util/info');
const isExist = require('../util/isExist');
const { validationResult } = require('express-validator');
const appDir = require('../util/appDir');
const createPDF = require('../util/invoice/invoice.js');
const path = require('path');


const loadAllCarts = async (userId, next) => {
    const carts = await Cart.findAll({
        where: {
            userId
        },
        include: {
            model: OrderedProducts,
            attributes: ['count', 'title', 'price']
        }
    }).catch(error => next(new Error(error)));
    const allCarts = [];
    carts.forEach(e => {
        let cart = {
            id: e.id,
            products: [],
            cartPrice: 0
        };
        let cartPrice = 0;
        e.orderedProducts.forEach(o => {
            let product = {
                title: o.title,
                count: o.count,
                price: o.price
            };
            cartPrice += (o.count * o.price);
            cart.products.push(product);
        });
        cart.cartPrice = cartPrice;
        allCarts.push(cart);
    });
    return allCarts;
};

const loadInvoiceData = async (userId, invoiceId, next) => {
    let totalPrice = 0;
    const products = [];
    const invoice = await Cart.findOne({
        where: {
            userId
        },
        include: {
            model: OrderedProducts,
            attributes: ['count', 'title', 'price'],
            where: {
                cartId: invoiceId
            }
        }
    }).catch(error => next(new Error(error)));
    invoice.orderedProducts.forEach(p => {
        const prod = {
            title: p.title,
            price: p.price,
            count: p.count,
            total: p.price * p.count
        };
        products.push(prod);
        totalPrice += (p.count * p.price);
    });
    return { invoiceId, products, totalPrice };
};

const loadOrderPage = async (req, res, next) => {
    const user = await User.findOne({ where: { id: req.userId }, include: { model: OrderItem, include: Product } }).catch(error => next(new Error(error)));
    const products = [];
    user.orderItems.forEach(o => { products.push({ title: o.product.title, count: o.count, productId: o.product.id }); });
    let totalPrice = 0;
    user.orderItems.forEach(o => { totalPrice += o.count * o.product.price; });
    const order = {
        products,
        totalPrice
    };
    res.render('shop/orders', {
        title: 'Twoje zamówienia',
        path: req.url,
        order,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin
    });
};

const addOrder = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.render('home', {
            title: 'Sklep',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            info: new Info('error', 'Ups... coś poszło nie tak')
        });
    }
    const id = req.params.id;
    const order = await OrderItem.findOne(
        {
            where: {
                productId: id,
                userId: req.userId
            }
        }).catch(error => next(new Error(error)));
    if (order) {
        const count = order.count + 1;
        await OrderItem.update({ count }, {
            where: {
                id: order.id
            }
        }).catch(error => next(new Error(error)));
    } else {
        await OrderItem.create({ count: 1, productId: id, userId: req.userId }).catch(error => next(new Error(error)));
    };
    res.redirect('/orders');
};

const removeOrder = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.render('home', {
            title: 'Sklep',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            info: new Info('error', 'Ups... coś poszło nie tak')
        });
    }
    const id = req.params.id;
    const order = await OrderItem.findOne(
        {
            where: {
                productId: id,
                userId: req.userId
            }
        }).catch(error => next(new Error(error)));
    if (order.count == 1) {
        await OrderItem.destroy({
            where: {
                id: order.id
            }
        }).catch(error => next(new Error(error)));
    } else {
        const count = order.count - 1;
        await OrderItem.update({ count }, {
            where: {
                id: order.id
            }
        }).catch(error => next(new Error(error)));
    }
    res.redirect('/orders');
};

const buyCart = async (req, res, next) => {
    const cart = await Cart.create({ userId: req.userId }).catch(error => next(new Error(error)));
    const orProd = await OrderItem.findAll(
        {
            where: { userId: req.userId },
            attributes: ['count'],
            include: { model: Product, attributes: ['title', 'price'] },
        }
    ).catch(error => next(new Error(error)));
    for (let i = 0; i < orProd.length; i++) {
        const prod = orProd[i];
        await OrderedProducts.create({
            title: prod.product.title,
            count: prod.count,
            price: prod.product.price,
            userId: req.userId,
            cartId: cart.id
        }).catch(error => next(new Error(error)));
    }
    await OrderItem.destroy({ where: { userId: req.userId } }).catch(error => next(new Error(error)));
    res.redirect('/bought');
};

const loadCartPage = async (req, res, next) => {
    const allCarts = await loadAllCarts(req.userId, next);
    res.render('shop/orderedCarts', {
        title: 'Twoje zakupy',
        path: req.path,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        allCarts
    });
};

const downloadPDf = async (req, res, next) => {
    const invoiceId = req.params.id;
    const userId = req.userId;
    const hasInvoice = await Cart.findOne({
        where: {
            userId,
            id: invoiceId
        }
    }).catch(error => next(new Error(error)));
    if (hasInvoice) {
        const invoiceName = Date.now() + 'paragon' + invoiceId + '.pdf';
        const filePath = path.join(appDir, 'invoice', invoiceName);
        const data = await loadInvoiceData(userId, invoiceId, next);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment, filename=' + invoiceName);
        // const isFileExist = await isExist(filePath);
        // if (!isFileExist) {
        //     await createPDF(data, filePath);
        // }
        res.status(201).send(await createPDF(data, next));
        // , (err) => {
        //     if (err) { next(new Error(err)); }
        // }
    } else {
        res.send('<p>Nie ma takiego pliku</p>');
    }
};

module.exports = {
    loadOrderPage,
    addOrder,
    removeOrder,
    buyCart,
    loadCartPage,
    downloadPDf
};