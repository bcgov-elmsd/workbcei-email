
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
  res.render('index',{
    layout: 'layoutnotrack',
  });
});

var centreredirect = {
  centre1: "https://www.workbc.ca/WorkBC-Centres/Kootenay/Castlegar.aspx",
  centre2: "https://www.workbc.ca/WorkBC-Centres/North-Coast-Nechako/Kitimat.aspx",
  centre3: "https://www.workbc.ca/WorkBC-Centres/Thompson-Okanagan/Ashcroft.aspx",
  centre4: "https://www.workbc.ca/WorkBC-Centres/Thompson-Okanagan/Chase.aspx"
};

//defaults to SF1 for now
var ca = [
 "", //0
// Test ones for 1 to 4
 "ELMSD.Webmaster@gov.bc.ca", //1 
 "Rafael.Solorzano@gov.bc.ca", //2
 "WorkBCJobs@gov.bc.ca", //3 
 "WorkBCHiring@gov.bc.ca", //4
/*
 "centre-campbellriver@workbc.ca", //1
 "centre-courtenay@workbc.ca", //2
 "centre-portalberni@workbc.ca", //3
 "centre-nanaimo@workbc.ca", //4
 "centre-duncan@workbc.ca", //5
 "centre-langford@workbc.ca", //6
 "centre-victoria-douglas@workbc.ca", //7
 "centre-sidney@workbc.ca", //8
 "centre-sechelt@workbc.ca", //9
 "centre-northvancouver@workbc.ca", //10
 "centre-vancouver-134easthastings@workbc.ca", //11
 "centre-vancouver-east3rd@workbc.ca", //12
 "centre-vancouver-commercial@workbc.ca", //13
 "centre-vancouversouth@workbc.ca", //14
 "centre-richmond-no5@workbc.ca", //15
 "centre-mapleridge@workbc.ca", //16
 "centre-portmoody@workbc.ca", //17
 "centre-delta-88th@workbc.ca", //18
 "centre-surreyguildford@workbc.ca", //19
 "centre-surrey-56@workbc.ca", //20
 "centre-surreynewton@workbc.ca", //21
 "centre-surrey-152@workbc.ca", //22
 "centre-langley-willowbrook@workbc.ca", //23
 "centre-burnaby-4211kingsway@workbc.ca", //24
 "centre-newwestminster@workbc.ca", //25
 "centre-mission@workbc.ca", //26
 "centre-abbotsford@workbc.ca", //27
 "centre-chilliwack@workbc.ca", //28
 "centre-quesnel@workbc.ca", //29
 "centre-merritt@workbc.ca", //30
 "centre-kamloops-lansdowne@workbc.ca", //31
 "centre-penticton@workbc.ca", //32
 "centre-kelowna@workbc.ca", //33
 "centre-salmonarm@workbc.ca", //34
 "centre-trail@workbc.ca", //35
 "centre-creston@workbc.ca", //36
 "centre-fernie@workbc.ca", //37
 "centre-vernon@workbc.ca", //38
 "centre-princerupert@workbc.ca", //39
 "centre-terrace@workbc.ca", //40
 "centre-smithers@workbc.ca", //41
 "centre-vanderhoof@workbc.ca", //42
 "centre-valemount@workbc.ca", //43
 "centre-fortstjohn@workbc.ca", //44
 "centre-dawsoncreek@workbc.ca", //45
 */
];

//Not used, might need in future
router.get('/workbc', (req, res) => {
  //console.log(req.params)
  //console.log(req.query)
  //console.log(centreredirect[req.query.rurl])
  var uid = Strings.orEmpty(req.query.uid);
  var redirect = ""
  res.render('workbccentre', {
    layout: 'redirect_layout',
    data: {},
    errors: {},
    rurl: redirect,
    uid: uid,
  });
})

router.get('/contactworkbcdone', (req,res)=>{
  res.render('contactworkbcdone',{
    layout: 'layout_thankyou'
  });
})

router.get('/contactworkbc', csrfProtection, (req, res) => {
  var fname = Strings.orEmpty(req.query.fname);
  var lname = Strings.orEmpty(req.query.lname);
  var email = Strings.orEmpty(req.query.email);
  var centre = Strings.orEmpty(req.query.centre);
  var uid = Strings.orEmpty(req.query.uid);
  res.render('contactworkbc', {
    data: {},
    errors: {},
    csrfToken: req.csrfToken(),
    //rurl: req.query.rurl,
    fname: fname,
    lname: lname,
    email: email,
    centre: centre,
    uid: uid,
  });
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
    //console.log(req.body);
    const errors = validationResult(req);
    //console.log(errors);
    //const errors = [];
    if (!errors.isEmpty()) {
      return res.render("contactworkbc", {
        data: req.body,
        fname: req.body.firstname,
        lname: req.body.lastname,
        email: req.body.email,
        centre: req.body.centre,
        uid: req.body._uid,
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
        to: "Test <" + ca[data.workbccentre] + ">", // list of receivers
        subject: "New TRF Referral - " + data.firstname + " " + data.lastname, // Subject line
        text: createEmailContactPlainText(data), // plain text body
        html: createEmailContactHtml(data) // html body
      }
      let info = transporter.sendMail(message, (error, info) => {
        if (error) {
          req.flash("error", "An error occured while submitting the form, please try again. If the error persists please try again later.");
          return res.render("contactworkbc", {
            data: req.body,
            fname: req.body.firstname,
            lname: req.body.lastname,
            email: req.body.email,
            centre: req.body.centre,
            uid: req.body._uid,
            errors: errors.mapped(),
            csrfToken: req.csrfToken()
          });
        } else {
          console.log("Message sent: %s", info.messageId);
          req.flash("uid",req.body._uid)
          req.flash("success", "Form has been submitted");
          res.redirect("/contactworkbcdone");
        }
      })
    } catch (error) {
      console.log(error);
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

  html += "<p>This referral came from an online form created by the Ministry. For more information on this referral process contact please contact your CAPA.</p><br>"

  html += "<p>CA" + data.workbccentre + "</p>"

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

  plain += "This referral came from an online form created by the Ministry. For more information on this referral process contact please contact your CAPA.\n"

  plain += "CA" + data.workbccentre + "\n"

  return plain;
}




module.exports = router
