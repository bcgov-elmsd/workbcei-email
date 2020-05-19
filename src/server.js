const path = require("path");
const express = require("express");
const layout = require("express-layout");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("express-flash");
const helmet = require('helmet');



const routes = require("./routes");
const app = express();

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';



const middlewares = [
  helmet(),
  layout(),
  express.static(path.join(__dirname, "public")),
  bodyParser.urlencoded({ extended: true }),
  cookieParser(),
  session({
    secret: process.env.SECRET || process.env.OPENSHIFT_NODEJS_SECRET ||"super-secret-key",
    key: process.env.KEY || process.env.OPENSHIFT_NODEJS_KEY || "super-secret-cookie",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 }
  }),
  flash()
];
app.use(middlewares);

app.use("/", routes);

app.use((req, res, next) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('servererror')
});

app.listen(port,ip, () => {
  console.log('App running at http://' + ip + ':' + port);
});
