
const express = require('express');
const router = express.Router();
const { check, validationResult, matchedData } = require('express-validator');
const nodemailer = require("nodemailer");
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });


const Strings = {};
Strings.orEmpty = function (entity) {
  return entity || "";
};
Strings.orSlash = function(entity){
  return entity || "/";
}

Strings.orSpace = function(entity){
  return entity || " ";
}

router.get('/', (req, res) => {
  res.render('index')
});

var centreredirect = {
  centre1: "https://www.workbc.ca/WorkBC-Centres/Kootenay/Castlegar.aspx",
  centre2: "https://www.workbc.ca/WorkBC-Centres/North-Coast-Nechako/Kitimat.aspx",
  centre3: "https://www.workbc.ca/WorkBC-Centres/Thompson-Okanagan/Ashcroft.aspx",
  centre4: "https://www.workbc.ca/WorkBC-Centres/Thompson-Okanagan/Chase.aspx"
};

router.get('/workbc', (req, res) => {
  console.log(req.params)
  console.log(req.query)
  console.log(centreredirect[req.query.rurl])
  var redirect = Strings.orSlash(centreredirect[req.query.rurl])
  res.render('workbccentre', {
    layout: 'redirect_layout',
    data: {},
    errors: {},
    rurl: redirect,
  });
})

router.get('/contactworkbcdone', (req,res)=>{
  res.render('contactworkbcdone')
})

router.get('/contactworkbc', csrfProtection, (req, res) => {
  var fname = Strings.orEmpty(req.query.fname);
  var lname = Strings.orEmpty(req.query.lname);
  var email = Strings.orEmpty(req.query.email);
  var centre = Strings.orEmpty(req.query.centre);
  res.render('contactworkbc', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),
    //rurl: req.query.rurl,
    fname: fname,
    lname: lname,
    email: email,
    centre: centre,
  });
  console.log(fname);
})

router.post(
  "/contactworkbc", csrfProtection,
  [
    check("firstname")
    .notEmpty()
    .trim()
    .withMessage("Please enter your first name."),
    check("lastname")
    .notEmpty()
    .trim()
    .withMessage("Please enter your last name."),
    check("phone")
    .optional({checkFalsy: true})
    .isMobilePhone(['en-CA', 'en-US'])
    .withMessage("Please enter a valid phone number."),
    check("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .bail()
    .trim()
    .normalizeEmail(),
    check("message")
     .optional(),
    check("workbccentre")
    .not().isIn(['', '0'])
    .withMessage("Please select a centre to contact."),
    check("consent")
    .notEmpty()
    .withMessage("You must agree before submitting."),
  ],
  (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    //console.log(errors);
    //const errors = [];
    if (!errors.isEmpty()) {
      return res.render("contactworkbc", {
        data: req.body,
        errors: errors.mapped(),
        csrfToken: req.csrfToken()
      });
    }

    const data = matchedData(req);
    console.log("Sanitized: ", data);
    
    try {
      let transporter = nodemailer.createTransport({
        host: "apps.smtp.gov.bc.ca",
        port: 25,
        secure: false,
        tls: {
          rejectUnauthorized: false
        }
      });
      let message = {
        from: 'TRF Referral <donotreply@gov.bc.ca>', // sender address
        to: "Test <ELMSD.Webmaster@gov.bc.ca>", // list of receivers
        subject: "New TRF Referral - " + data.firstname + " " + data.firstname, // Subject line
        text: createEmailContactPlainText(data), // plain text body
        html: createEmailContactHtml(data) // html body
      }
      let info = transporter.sendMail(message, (error, info) => {
        if (error) {
          req.flash("error", "An error occured while submitting the form, please try again. If the error persists please try again later.");
          return res.render("contactworkbc", {
            data: req.body,
            errors: errors.mapped(),
            csrfToken: req.csrfToken()
          });
        } else {
          console.log("Message sent: %s", info.messageId);
          req.flash("success", "Form has been submitted");
          res.redirect("/contactworkbcdone");
        }
      })
    } catch (error) {

    }

  }
);


function createEmailContactHtml(data) {
  var html = "";
  //html += "<p>Salutation: " + data.salutation + ".</p>"
  html += "<p>Hello,</p>"
  html += "<p>You have received a new TRF referral – see details below. Please aim to make contact with the individual as soon as possible.</p>"
  html += "<p>First Name: " + data.firstname + "</p>"
  html += "<p>Last Name: " + data.lastname + "</p>"
  html += "<p>Email: " + data.email + "</p>"
  html += "<p>Phone: " + Strings.orEmpty(data.phone) + "</p>"
  html += "<p>Message:</p>"
  html += "<p>" + Strings.orEmpty(data.message) + "</p><br>"

  html += "<p>This referral came from an online form created by the Ministry. For more information on this referral process contact please contact your CAPA.</p>"

  return html;

}

function createEmailContactPlainText(data) {
  var plain = "";
  plain += "Hello, \n"
  plain += "You have received a new TRF referral – see details below. Please aim to make contact with the individual as soon as possible.\n"
  plain += "First Name: " + data.firstname + "\n"
  plain += "Last Name: " + data.lastname + "\n"
  plain += "Email: " + data.email + "\n"
  plain += "Phone: " + Strings.orEmpty(data.phone) + "\n"
  plain += "Message:\n"
  plain += Strings.orEmpty(data.message) + "\n\n"

  plain += "This referral came from an online form created by the Ministry. For more information on this referral process contact please contact your CAPA."

  return plain;
}




module.exports = router
