const { Router } = require('express');
const shopController = require('../controllers/shopController');
const Auth = require('../controllers/authorization');
const { body } = require('express-validator');
const multer = require('multer');

const upload = multer({
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
            return cb(null, true);
        }
        return cb(null, false);
    },
    fileSize: 2000000
}).single('imageUrl');

const router = Router();

router.get('/addProduct', Auth.isLogin, Auth.onlyLogin, Auth.onlyAdmin, shopController.loadAddProductPage);

router.post('/addProduct', upload, [
    body('product', { message: 'Nazwa: liczba znaków 3 - 30, tylko cyfry i litery' })
        .escape()
        .isLength({ min: 3, max: 30 })
        .isAlphanumeric()
        .trim(),
    body('description', { message: 'Opis: liczba znaków 3 - 200' })
        .escape()
        .isLength({ min: 3, max: 200 })
        .trim(),
    body('price', { message: 'Nieprawidłowa cena' })
        .escape()
        .isNumeric()
], Auth.isLogin, Auth.onlyLogin, Auth.onlyAdmin, shopController.addProduct);

module.exports = router;