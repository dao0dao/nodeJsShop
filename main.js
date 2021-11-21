const express = require('express');

const homeRout = require('./routs/home');
const addProdRout = require('./routs/addProduct');
const productsRout = require('./routs/products');
const ordersRout = require('./routs/orders');
const adminRout = require('./routs/admin');
const errorRout = require('./routs/error');

const sequelize = require('./util/mySql');
const cookieParser = require('cookie-parser');
const protection = require('./util/csurf');

const Product = require('./models/product');
const OrderItem = require('./models/orderItem');
const User = require('./models/user');
const OrderedProducts = require('./models/orderedProducts');
const Cart = require('./models/cart');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static('public'));
app.use(['/image', '/products/image'], express.static('image'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser(['secret', 'thisIsMySecret', 'secretService']));
app.use(protection);

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(productsRout);
app.use(addProdRout);
app.use(ordersRout);
app.use(adminRout);
app.use(homeRout);
app.use(errorRout);
app.use((err, req, res, next) => {
    console.log(err);
    res.redirect('/500');
});

OrderItem.belongsTo(Product, { onDelete: 'CASCADE' });
User.hasMany(OrderItem, { onDelete: 'CASCADE' });
User.hasMany(OrderedProducts, { onDelete: 'CASCADE' });
Cart.hasMany(OrderedProducts, { onDelete: 'CASCADE' });
User.hasMany(Cart, { onDelete: 'CASCADE' });



// sequelize.sync()
//     .then(() => {
//         app.listen(port, () => {
//             console.log(`Server is running on port ${port}`);
//         });
//     })
//     .catch((err) => {
//         app.listen(port, () => {
//             console.log(`Server is running on port ${port}`);
//         });
//     });
app.listen(process.env.PORT || 3000, () => {
    console.log(`------Server is running on port ${process.env.PORT || 3000}---------`);
    sequelize.sync()
        .then(() => {
            console.log('połączono z bazą danych');
        })
        .catch((err) => {
            app.listen(port, () => {
                setTimeout(() => {
                    sequelize.sync();
                }, (1000 * 60 * 5));
                console.log(`brak połączenia z bazą danych, następna próba za 5 min`);
            });
        });
});