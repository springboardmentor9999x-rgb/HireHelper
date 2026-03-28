const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "snehalmpatil2004@gmail.com",          // your gmail
    pass: "kldu aihh ximb taha"             // gmail app password
  }
});

module.exports = transporter;