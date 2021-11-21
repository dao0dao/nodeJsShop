const fs = require('fs');
const isFileExist = require('../util/isExist');
const path = require('path');
const bcrypt = require('bcrypt');
const uniqId = require('uniqid');
const appDir = require('../util/appDir');
const User = require('../models/user');
const Admin = require('./adminController');
const Info = require('../util/info');
const sendMailTo = require('../util/mailSender').sendRegisterMailTo;
const { validationResult } = require('express-validator');



const bcryptHash = 13;
const sesFolder = path.join(appDir, 'session');



const createCookie = (res, id) => {
    res.cookie('sid_', id, {
        httpOnly: true,
        expires: Date.now() + 3600000,
        maxAge: 3600000,
        secure: false,
    });
    res.redirect('/');
};

const deleteCookie = (res, id) => {
    res.clearCookie('sid_', id, {
        httpOnly: true,
        secure: false,
    });
};

const createSession = async (userId, isAdmin) => {
    const id = uniqId('sid_');
    const p = path.join(sesFolder, `${id}.json`);
    const isExist = await isFileExist(p).catch(error => next(new Error(error)));
    if (!isExist) {
        let session = {
            userId,
            isAdmin,
            expires: Date.now() + 3600000
        };
        fs.writeFileSync(p, JSON.stringify(session));
        return id;
    } else {
        createSession(userId, isAdmin);
    }
};

const deleteSession = (sessionId, next) => {
    const p = path.join(sesFolder, `${sessionId}.json`);
    fs.unlink(p, (err) => { if (err) { next(new Error(err)); } });
};

const register = async (req, res, next) => {
    const error = validationResult(req);
    const { email, password, confirmPassword } = req.body;
    const info = [];
    if (!error.isEmpty()) {
        const msgArr = [];
        error.errors.forEach(err => {
            if (!msgArr.includes(err.msg)) {
                msgArr.push(err.msg);
            };
        });
        msgArr.forEach(m => { info.push(new Info('error', m)); });
        return Admin.showRegisterPage(req, res, next, info);
    }
    const user = await User.findOne({
        where: {
            email
        }
    }).catch(error => next(new Error(error)));
    if (user) {
        info.push(new Info('error', 'Taki użytkownik już istnieje'));
        return Admin.showRegisterPage(req, res, next, info);
    } else {
        const activateCode = uniqId();
        const activateCodeExpires = Date.now() + 3600000;
        await User.create({
            email,
            password: await bcrypt.hash(password, bcryptHash),
            activateCode,
            activateCodeExpires
        }).catch(error => next(new Error(error)));
        sendMailTo(email, req.headers.host, activateCode).catch(error => next(new Error(error)));
        const confirm = new Info('confirm', 'Email aktywujący konto został wysłany');
        return res.render('home', {
            title: 'Sklep',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            info: confirm
        });
    }
};

const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty) {
        const info = new Info('error', 'Złe hasło lub login');
        Admin.showLoginPage(req, res, next, info);
    }
    const { email, password } = req.body;
    const user = await User.findOne({
        where: {
            email
        }
    }).catch(error => next(new Error(error)));
    if (!user) {
        const info = new Info('error', 'Złe hasło lub login');
        Admin.showLoginPage(req, res, next, info);
    } else {
        if (!user.isActive) {
            const info = new Info('error', 'Konto jest nieaktywne');
            res.render('home', {
                title: 'Sklep',
                path: req.url,
                isLogin: req.isLogin,
                isAdmin: req.isAdmin,
                info
            });
        } else if (bcrypt.compareSync(password, user.password)) {
            let sessionId;
            await createSession(user.id, user.isAdmin).then(res => { sessionId = res; }).catch(error => next(new Error(error)));
            createCookie(res, sessionId);
        } else {
            const info = new Info('error', 'Złe hasło lub login');
            Admin.showLoginPage(req, res, next, info);
        }
    }
};

const logout = (req, res, next) => {
    deleteSession(req.sessionId, next);
    deleteCookie(res, req.sessionId);
    res.redirect('/');
};

const onlyLogin = (req, res, next) => {
    if (!req.isLogin) {
        res.redirect('/login');
    }
    next();
};

const onlyAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        res.redirect('/');
    }
    next();
};

const notAdmin = (req, res, next) => {
    if (req.isAdmin) {
        return res.redirect('/');
    }
    next();
};

const isLogin = async (req, res, next) => {
    const regEx = /sid_[\s\S]*/g;
    if (!req?.cookies.sid_) {
        req.isLogin = false;
        return next();
    }
    const filename = req.cookies.sid_;
    const p = path.join(appDir, 'session', `${filename}.json`);
    const isExist = await isFileExist(p).catch(error => next(new Error(error)));
    if (!isExist) {
        deleteCookie(res, req.sessionId);
        req.isLogin = false;
        return next();
    }
    const file = require(p);
    if (file.expires < Date.now()) {
        //sesja wygasła
        deleteCookie(res, req.sessionId);
        deleteSession(req.sessionId, next);
        req.isLogin = false;
        return next();
    }
    if (!req.userId) {
        req.userId = file.userId;
        req.sessionId = filename;
        req.isAdmin = file.isAdmin;
        req.isLogin = true;
    }
    next();
};

const clearExpiredSessions = async () => {
    const p = path.join(appDir, 'session');
    fs.readdir(p, 'utf8', (err, files) => {
        if (err) {
            next(new Error(error));
        } else {
            files.forEach(filename => {
                const file = require(path.join(p, filename));
                if (file.expires < Date.now()) {
                    fs.unlink(path.join(appDir, 'session', filename), (err) => { if (err) { next(new Error(error)); } });
                }
            });

        }
    });
};

const deleteAccount = async (req, res, next) => {
    Admin.deleteAccount(req.userId)
        .then(logout(req, res, next))
        .catch(res.redirect('back'));
};

clearExpiredSessions();

setInterval(() => {
    clearExpiredSessions();
}, 3600000);

module.exports = {
    register,
    login,
    logout,
    isLogin,
    onlyLogin,
    onlyAdmin,
    notAdmin,
    deleteAccount
};