const Sequelize = require('sequelize');
const sequelize = require('../util/mySql');

const Cart = sequelize.define('cart', {
    id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
    }
});

module.exports = Cart;