const { Router } = require('express');
const Auth = require('../controllers/authorization');
const router = Router();

router.get('/', Auth.isLogin, (req, res, next, info = undefined) => {
    res.render('home', {
        title: 'Sklep',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        info
    });
});

module.exports = router;