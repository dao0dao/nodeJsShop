const Router = require('express');
const Auth = require('../controllers/authorization');
const router = Router();

router.get('/500', Auth.isLogin, (req, res, next) => {
    res.render('error500', {
        title: 'Błąd',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
    });
});

router.get('*', Auth.isLogin, (req, res, next) => {
    res.render('error', {
        title: 'Błąd',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
    });
});

router.post('*', Auth.isLogin, (req, res, next) => {
    res.render('error', {
        title: 'Błąd',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
    });
});

module.exports = router;