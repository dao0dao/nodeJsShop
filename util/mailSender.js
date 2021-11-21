const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const setHtml = (domain, uniqId) => {
    const html = `<h1>Witamy w sklep node.js</h1>
    <p>Aby dokończyć proces rejestracji skorzystaj z linku aktywacyjnego:</p>
    <a href="https://${domain}/activation/${uniqId}" target="_blank">https://${domain}/activation/${uniqId}</a>
    <p>Jest on ważny tylko przez 1 godzinę.</p>
    <p>Serdecznie pozdrawiamy</p>`;
    return html.toString();
};

const resetHtml = (domain, uniqId) => {
    const html = `<h1>Reset hasła w sklep node.js</h1>
    <p>Wysyłamy link resetujący hasło:</p>
    <a href="${domain}/password_reset/${uniqId}" target="_blank">${domain}/password_reset/${uniqId}</a>
    <p>Jest on ważny tylko przez 1 godzinę.</p>
    <p>Serdecznie pozdrawiamy</p>`;
    return html.toString();
};

const sendRegisterMailTo = async (mail, domain, uniqId) => {
    transporter.sendMail({
        from: '"sklep nodejs" <nno_name@tlen.pl>', // sender address
        to: mail, // list of receivers
        subject: "Skep NodeJS", // Subject line
        html: setHtml(domain, uniqId)

    }).catch(err => console.log(err));
};

const sendResetEmailTo = async (mail, domain, uniqId) => {
    transporter.sendMail({
        from: '"sklep nodejs" <nno_name@tlen.pl>', // sender address
        to: mail, // list of receivers
        subject: "Skep NodeJS", // Subject line
        html: resetHtml(domain, uniqId)
    }).catch(err => { console.log(err); });
};

module.exports = {
    sendRegisterMailTo,
    sendResetEmailTo
};