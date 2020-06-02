
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
  res.render('contactworkbc', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),
    rurl: req.query.rurl,
    fname: req.query.fname,
    email: req.query.email,
    centre: req.query.centre,
  });
})

router.post(
  "/contactworkbc", csrfProtection,
  [
    check("firstname")
    .notEmpty()
    .withMessage("Please enter your first name."),
    check("lastname")
    .optional(),
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
    /*
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
        from: 'WorkBC Referral <donotreply@gov.bc.ca>', // sender address
        to: "Test <ELMSD.Webmaster@gov.bc.ca>", // list of receivers
        subject: "Contact Me", // Subject line
        text: createPlainText(data), // plain text body
        html: createHtml(data) // html body
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
    */
        
    
    //sendMail(data);
    req.flash("success", "Form has been submitted");
    res.redirect("/contactworkbcdone");

  }
);



/*
router.get('/about', (req, res) => {
  res.render('about')
});
*/





module.exports = router
