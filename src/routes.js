
const express = require('express');
const router = express.Router();
const { check, validationResult, matchedData } = require('express-validator');

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
    data: {},
    errors: {},
    rurl: req.query.rurl,
  });
})



/*
router.get('/about', (req, res) => {
  res.render('about')
});
*/





module.exports = router
