const Sequelize = require('sequelize');
const sequelize = require('../util/mySql');

const OrderItem = sequelize.define('orderItem', {
    id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    count: Sequelize.INTEGER
});

module.exports = OrderItem;