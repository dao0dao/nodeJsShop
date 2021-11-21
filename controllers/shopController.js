const Product = require('../models/product');
const appDir = require('../util/appDir');
const fs = require('fs');
const { validationResult } = require('express-validator');
const PRODUCT_PER_PAGE = 4;

const writeFile = (prefix, file) => {
    return isWritten = new Promise((resolve, reject) => {
        if (!prefix || !file) {
            return reject('Nie podano daty lub brak pliku');
        }
        fs.access(`${appDir}/image`, (err) => {
            if (err) {
                fs.mkdir(`${appDir}/image`, (err) => {
                    if (err) {
                        return reject('Nie można stworzyć folderu /image');
                    }
                    fs.writeFile(`${appDir}/image/${prefix}-${file.originalname}`, file.buffer, (err) => {
                        if (err) {
                            return reject('Nie można stworzyć obrazu w /image');
                        }
                        return resolve(`image/${prefix}-${file.originalname}`);
                    });
                });
            } else {
                fs.writeFile(`${appDir}/image/${prefix}-${file.originalname}`, file.buffer, (err) => {
                    if (err) {
                        return reject('Nie można stworzyć obrazu w /image');
                    }
                    return resolve(`image/${prefix}-${file.originalname}`);
                });
            }
        });
    });
};

const deleteFile = (filePath, next) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            next(new Error(err));
        };
    });
};


const loadProductPage = async (req, res, next) => {
    let page = 1;
    const error = validationResult(req);
    if (error.isEmpty()) {
        page = parseInt(req.query.page);
    }
    const productsCount = await Product.count();
    const maxPages = Math.ceil(productsCount / PRODUCT_PER_PAGE);
    const products = await Product.findAll({
        offset: PRODUCT_PER_PAGE * (page - 1),
        limit: PRODUCT_PER_PAGE
    }).catch(error => { next(new Error(error)); });
    res.render('shop/shop', {
        title: 'Sklep',
        path: req.url,
        products,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        page,
        maxPages
    });
};

const addProduct = async (req, res, next) => {
    const errors = validationResult(req);
    const file = req.file;
    const msgArr = [];
    const count = await Product.count();
    if (count >= 10) {
        msgArr.push('Osiągnięto maksymalną liczbę produktów - 10');
    }
    if (file) {
        const buf = Buffer.from(file.buffer).toString();
        if (buf.includes('<scr') || buf.includes('echo') || buf.includes('print')) {
            msgArr.push('Nieprawidłowy plik');
        }
    }
    if (!errors.isEmpty() || msgArr.length) {
        let { product, description, price } = req.body;
        errors.errors.forEach(err => {
            if (!msgArr.includes(err.msg.message)) {
                msgArr.push(err.msg.message);
            };
            switch (err.param) {
                case 'product':
                    product = '';
                    break;
                case 'description': description = '';
                    break;
                case 'price': price = 0;
                    break;
            }
        });
        const infoErr = {
            messages: msgArr,
            product,
            description,
            price
        };
        return res.render('admin/addProd', {
            title: 'Dodaj produkt',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            csrfToken: req.csrfToken(),
            infoErr
        });
    }
    const { product, description, price } = req.body;
    const prefix = Date.now();
    const imageUrl = await writeFile(prefix, file).catch((error) => { next(new Error(error)); });
    await Product.create({ title: product, description, imageUrl, price }).catch(error => next(new Error(error)));
    res.redirect('/products');
};

const loadAddProductPage = (req, res, next) => {
    res.render('admin/addProd', {
        title: 'Dodaj produkt',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        csrfToken: req.csrfToken(),
        infoErr: undefined
    });
};

const loadCartPage = async (req, res, next) => {
    const id = req.params.id;
    const product = await Product.findOne({ where: { id } })
        .then(
            (res) => res
        ).catch(error => next(new Error(error)));
    res.render('shop/cart', {
        title: 'Szczegóły produktu',
        path: '/products',
        product,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin
    });
};

const deleteProduct = async (req, res, next) => {
    const error = validationResult(req);
    const imageUrl = req.body.imageUrl;
    if (!error.isEmpty()) {
        res.render('home', {
            title: 'Sklep',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            info: new Info('error', 'Ups... coś poszło nie tak')
        });
    }
    const id = req.params.id;
    deleteFile(imageUrl, next);
    Product.destroy({ where: { id } })
        .then(() => {
            res.redirect('/products');
        })
        .catch(() => {
            res.redirect('back');
        });
};

module.exports = {
    loadProductPage,
    addProduct,
    loadAddProductPage,
    loadCartPage,
    deleteProduct
};