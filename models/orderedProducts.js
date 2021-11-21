const Sequelize = require('sequelize');
const sequelize = require('../util/mySql');

const OrderedProducts = sequelize.define('orderedProducts', {
    id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    title: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
    },
    count: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: Sequelize.DataTypes.DOUBLE,
        allowNull: false
    }
});

module.exports = OrderedProducts;