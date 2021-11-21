const Sequelize = require('sequelize');
const sequelize = require('../util/mySql');

const User = sequelize.define('user', {
    id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    email: Sequelize.STRING,
    name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
    },
    surname: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
    },
    password: Sequelize.STRING,
    isAdmin: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    isActive: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    activateCode: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    activateCodeExpires: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null
    },
    resetPassword: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    resetExpires: {
        type: Sequelize.DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null
    }
});

module.exports = User;