const { Router } = require('express');
const adminController = require('../controllers/adminController');
const authorization = require('../controllers/authorization');
const Auth = require('../controllers/authorization');
const { body, param } = require('express-validator');

const router = Router();

router.get('/profile', Auth.isLogin, Auth.onlyLogin, Auth.notAdmin, adminController.loadProfilePage);

router.post('/profile/update', [
    body('name', 'Imię - tylko litery, max 15 znaków')
        .isAlpha()
        .isLength({ max: 15 })
        .escape(),
    body('surname', 'Nazwisko - tylko litery, max 40 znaków')
        .isAlpha()
        .isLength({ max: 40 })
        .escape(),
    body('password', 'Hasło - min 5 znaków, max 10 znaków, tylko cyfry i litery')
        .isAlphanumeric()
        .custom((pass) => {
            if (pass.length === 0) { return true; }
            if (pass.length < 4) { return false; }
            if (pass.length > 10) { return false; }
            return true;
        })
        .escape(),
    body('password_confirm', 'Hasła się nie zgadzają')
        .custom((password_confirm, { req }) => {
            if (password_confirm != req.body.password) {
                throw new Error;
            }
            return true;
        })
], Auth.isLogin, Auth.onlyLogin, adminController.updateProfile);

router.post('/profile/delete', Auth.isLogin, Auth.onlyLogin, authorization.deleteAccount);

router.get('/users', Auth.isLogin, Auth.onlyAdmin, adminController.loadAllUsersPage);

router.post('/user/delete', [
    body('userId')
        .escape()
], Auth.isLogin, Auth.onlyAdmin, adminController.deleteUser);

router.get('/login', Auth.isLogin, adminController.showLoginPage);

router.post('/login', [
    body('email')
        .escape()
        .isEmail()
        .normalizeEmail(),
    body('password')
        .isAlphanumeric()
        .isLength({ min: 5, max: 10 })
        .escape()
], Auth.isLogin, authorization.login);

router.get('/register', Auth.isLogin, adminController.showRegisterPage);

router.post('/register', [
    body('email', 'Nieprawidłowy email')
        .escape()
        .isEmail()
        .normalizeEmail(),
    body('password', 'Hasło - min 5 znaków, max 10 znaków, tylko cyfry i litery')
        .isAlphanumeric()
        .isLength({ min: 5, max: 10 })
        .escape(),
    body('confirmPassword', 'Hasła różnią się')
        .custom((password_confirm, { req }) => {
            if (password_confirm != req.body.password) {
                throw new Error;
            }
            return true;
        })
], Auth.isLogin, authorization.register);

router.get('/activation/:activateCode', param('activateCode').escape(), adminController.activateUser);

router.get('/logout', Auth.isLogin, authorization.logout);

router.get('/resetPassword', Auth.isLogin, adminController.showResetPasswordPage);

router.post('/resetPassword', [
    body('email')
        .escape()
        .isEmail()
        .normalizeEmail()
], Auth.isLogin, adminController.sendResetEmail);

router.get('/password_reset/:id', [
    param('id')
        .escape()
], Auth.isLogin, adminController.showChangePasswordPage);

router.post('/password_reset/:id', [
    param('id')
        .escape(),
    body('password', 'Hasło - min 5 znaków, max 10 znaków, tylko cyfry i litery')
        .escape()
        .isAlphanumeric()
        .isLength({ min: 5, max: 10 }),
    body('passwordConfirm', 'Hasła różnią się')
        .custom((password_confirm, { req }) => {
            if (password_confirm != req.body.password) {
                throw new Error;
            }
            return true;
        })
], Auth.isLogin, adminController.changePasswordToNew);

module.exports = router;