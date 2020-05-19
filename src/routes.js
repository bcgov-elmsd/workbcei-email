
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

router.get('/', (req, res) => {
  res.render('index')
});

router.get('/workbc', (req, res) => {
  console.log(req.params)
  console.log(req.query)
  res.render('workbccentre', {
    layout: 'redirect_layout',
    data: {},
    errors: {},
    rurl: req.query.rurl,
  });
})

router.get('/contactworkbc', csrfProtection, (req, res) => {
  console.log(req.params)
  console.log(req.query)
  res.render('contactworkbc', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),
    rurl: req.query.rurl,
  });
})

router.post(
  "/contactworkbc", csrfProtection,
  [
  ],
  (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    //console.log(errors);
    //const errors = [];
    if (!errors.isEmpty()) {
      return res.render("jobseeker", {
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
        from: 'WorkBC Referral <donotreply@gov.bc.ca>', // sender address
        to: "WorkBC <WorkBCJobs@gov.bc.ca>", // list of receivers
        subject: "Contact Me", // Subject line
        text: createPlainText(data), // plain text body
        html: createHtml(data) // html body
      }
      let info = transporter.sendMail(message, (error, info) => {
        if (error) {
          req.flash("error", "An error occured while submitting the form, please try again. If the error persists please try again later.");
          return res.render("jobseeker", {
            data: req.body,
            errors: errors.mapped(),
            csrfToken: req.csrfToken()
          });
        } else {
          console.log("Message sent: %s", info.messageId);
          req.flash("success", "Form has been submitted");
          res.redirect("/jobseekerdone");
        }
      })
    } catch (error) {

    }
        
    
    //sendMail(data);
    //req.flash("success", "Form has been submitted");
    //res.redirect("/done");

  }
);



/*
router.get('/about', (req, res) => {
  res.render('about')
});
*/





module.exports = router
