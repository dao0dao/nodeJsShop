const csurf = require('csurf');
const protection = csurf({ cookie: true });
module.exports = protection;