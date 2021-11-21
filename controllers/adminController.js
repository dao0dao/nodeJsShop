const User = require('../models/user');
const bcrypt = require('bcrypt');
const bcryptHash = 13;
const Info = require('../util/info');
const { validationResult } = require('express-validator');
const sendMailTo = require('../util/mailSender').sendResetEmailTo;
const uniqId = require('uniqid');


const loadProfilePage = async (req, res, next, infoErr = undefined) => {
    const user = await User.findOne({
        where: {
            id: req.userId
        }
    }).catch(error => next(new Error(error)));
    const { name, surname, email } = user;
    res.render('admin/profile', {
        title: 'Panel użytkownika',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        name,
        surname,
        email,
        infoErr
    });
};

const showLoginPage = async (req, res, next, info = undefined) => {
    res.render('admin/login', {
        title: 'Logowanie',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        info,
    });
};

const showRegisterPage = (req, res, next, info = undefined) => {
    res.render('admin/register', {
        title: 'Rejestracja',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        info
    });
};

const showResetPasswordPage = (req, res, next, info = undefined) => {
    res.render('admin/resetPassword', {
        title: 'Resetowanie hasło',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        info
    });
};

const sendResetEmail = async (req, res, next) => {
    const { email } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty() || email.match(/(@.*@)+/g)) {
        const info = new Info('error', 'Nieprawidłowy email');
        return showResetPasswordPage(req, res, next, info);
    }
    const user = await User.findOne({ where: { email: email } }).catch(error => next(new Error(error)));
    if (!user) {
        const info = new Info('error', 'Nieprawidłowy email');
        return showResetPasswordPage(req, res, next, info);
    }
    const id = uniqId();
    await User.update({ resetExpires: Date.now() + 3600000, resetPassword: id }, { where: { id: user.id } }).catch(err => next(new Error(error)));
    sendMailTo(email, req.headers.host, id);
    res.render('home', {
        title: 'Sklep',
        path: req.url,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        info: new Info('confirm', 'Email aktywacyjny został wysłany')
    });
};

const showChangePasswordPage = async (req, res, next) => {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('home', {
            title: 'Sklep',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            info: new Info('error', 'Nieprawidłowy link')
        });
    }
    const user = await User.findOne({ where: { resetPassword: id } }).catch(error => next(new Error(error)));
    if (user) {
        if (user.resetExpires > Date.now()) {
            return res.render('admin/changePassword', {
                title: 'Sklep',
                path: req.url,
                isLogin: req.isLogin,
                isAdmin: req.isAdmin,
                id,
                info: undefined
            });
        } else {
            User.update({ resetExpires: 0, resetPassword: '' }, { where: { id: user.id } });
            return res.render('home', {
                title: 'Sklep',
                path: req.url,
                isLogin: req.isLogin,
                isAdmin: req.isAdmin,
                info: new Info('error', 'Link wygasł')
            });
        }
    } else {
        return res.render('home', {
            title: 'Sklep',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            info: new Info('error', 'Link wygasł')
        });
    }
};

const changePasswordToNew = async (req, res, next) => {
    const { id } = req.params;
    const { password } = req.body;
    const error = validationResult(req);
    if (!error.isEmpty()) {
        const info = [];
        const msgArr = [];
        error.errors.forEach(err => {
            if (!msgArr.includes(err.msg)) {
                msgArr.push(err.msg);
            };
        });
        msgArr.forEach(m => { info.push(new Info('error', m)); });
        return res.render('admin/changePassword', {
            title: 'Sklep',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            id,
            info
        });
    }
    const user = await User.findOne({ where: { resetPassword: id } }).catch(error => next(new Error(error)));
    User.update({ password: await bcrypt.hash(password, bcryptHash), resetExpires: 0, resetPassword: '' }, { where: { id: user.id } })
        .then(() => {
            res.render('home', {
                title: 'Sklep',
                path: req.url,
                isLogin: req.isLogin,
                isAdmin: req.isAdmin,
                info: new Info('confirm', 'Hasło zmienione')
            });
        })
        .catch(() => {
            res.render('home', {
                title: 'Sklep',
                path: req.url,
                isLogin: req.isLogin,
                isAdmin: req.isAdmin,
                info: new Info('error', 'Błąd zmiany hasła')
            });
        });
};

const updateProfile = async (req, res, next) => {
    let { name, surname, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const msgArr = [];
        errors.errors.forEach(err => {
            if (!msgArr.includes(err.msg)) {
                msgArr.push(err.msg);
            }
            switch (err.param) {
                case 'name': name = '';
                    break;
                case 'surname': surname = '';
                    break;
            }
        });
        const infoErr = {
            messages: msgArr,
            name,
            surname
        };
        return loadProfilePage(req, res, next, infoErr);
    }
    if (password === '') {
        await User.update({ name, surname }, {
            where: {
                id: req.userId
            }
        }).catch(error => next(new Error(error)));
        const info = new Info('confirm', 'Zaktualizowano dane');
        loadProfilePage(req, res, next, info);
    } else {
        await User.update({
            name,
            surname,
            password: await bcrypt.hash(password, bcryptHash)
        }, {
            where: {
                id: req.userId
            }
        }).catch(error => next(new Error(error)));
        const info = new Info('confirm', 'Zaktualizowano dane');
        loadProfilePage(req, res, next, info);
    }
};

const loadAllUsersPage = async (req, res, next) => {
    const users = await User.findAll({ attributes: ['id', 'email', 'name', 'surname'], where: { isAdmin: false } }).catch(error => next(new Error(error)));
    res.render('admin/allUsers', {
        title: 'Zarejestrowani użytkownicy',
        path: req.path,
        isLogin: req.isLogin,
        isAdmin: req.isAdmin,
        users
    });
};

const deleteUser = async (req, res, next) => {
    const errors = validationResult(res);
    if (!errors.isEmpty) {
        return res.redirect('back');
    }
    const userId = req.body.userId;
    User.destroy({ where: { id: userId } })
        .then(
            () => {
                res.redirect('/users');
            }
        )
        .catch(
            (err) => {
                if (err) {
                    res.redirect('/');
                }
            }
        );
};

const deleteAccount = (userId) => {
    return User.destroy({ where: { id: userId, isAdmin: false } });
};

const activateUser = async (req, res, next) => {
    const activateCode = req.params.activateCode;
    const info = new Info('error', 'Nieprawidłowy link aktywacyjny lub jego ważność wygasła');
    const user = await User.findOne({
        where: {
            activateCode
        }
    }).catch(error => next(new Error(error)));
    if (user) {
        if (user.activateCodeExpires > Date.now()) {
            await User.update({ isActive: true, activateCode: '', activateCodeExpires: 0 }, { where: { id: user.id } }).catch(err => next(new Error(error)));
            const info = new Info('confirm', 'Konto zostało aktywowane');
            res.render('home', {
                title: 'Sklep',
                path: req.url,
                isLogin: req.isLogin,
                isAdmin: req.isAdmin,
                info
            });
        } else {
            const info = new Info('error', 'Data aktywacji wygasła');
            res.render('home', {
                title: 'Sklep',
                path: req.url,
                isLogin: req.isLogin,
                isAdmin: req.isAdmin,
                info
            });
        }
    } else {
        res.render('home', {
            title: 'Sklep',
            path: req.url,
            isLogin: req.isLogin,
            isAdmin: req.isAdmin,
            info
        });
    }
};

module.exports = {
    loadProfilePage,
    updateProfile,
    showLoginPage,
    showRegisterPage,
    loadAllUsersPage,
    deleteUser,
    deleteAccount,
    activateUser,
    showResetPasswordPage,
    sendResetEmail,
    showChangePasswordPage,
    changePasswordToNew
};