const pdf = require('pdf-creator-node');
const fs = require('fs');
const path = require('path');
const appDir = require('../appDir');
const template = path.join(appDir, 'util', 'invoice', 'template.html');
const html = fs.readFileSync(template, 'utf8');

const options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
};

module.exports = createInvoice = (data, next) => {
    const document = {
        html: html,
        data: {
            data,
        },
        type: "buffer",
    };
    return pdf.create(document, options).catch(err =>{
        if(err){
            next(new Error(err));
        }
    });
};