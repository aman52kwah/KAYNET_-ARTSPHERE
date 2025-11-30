import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { Sequelize } from "sequelize";
import passport from 'passport';
import bodyParser from 'body-parser';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
//import { sequelize, User } from './models';
import "./models/index.js";
//const jwt = require('jsonwebtoken');
import connectSessionSequelize from "connect-session-sequelize";
import { modelsPromise } from "./models/index.js";

const SequelizeStore = connectSessionSequelize(session.Store);

const {sequelize, User, Products, OrderItems, Orders, CustomOrder} =await modelsPromise;

const app= express();

app.use(cors({
    origin:process.env.CLIENT_URL || 'http://http://localhost:3000',
    credentials:true
}));
app.use(express.json());

//middleware
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({
  extended: false,
});

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const sessionStore = new SequelizeStore({
  db: sequelize,
});

//INITIALIZE DB
async function initializeDatabase() {
  try {
    //test connection to the database

    await sequelize.authenticate();
    console.log("Neon PostgreSQL connection established successfully");

    //sync the models with the database
    await sequelize.sync({ alter: true });
    console.log("database synchronized successfully.");
    sessionStore.sync();
  } catch (error) {
    console.error(error);
  }
}
await initializeDatabase();


//=============COR CONFIGURATION
const allowedOrigins = [
  "http://localhost:3000", "http://localhost:5173",
  process.env.CLIENT_URL,
];



app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



//===========middleware for session
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET_SESSION || "fallbacksecret", //used to sign session cookies
    resave: false, // resave session if it is not modified
    saveUninitialized: false, // dont save unitialized session
    store: sessionStore, // use the session store created
    cookie: {
      secure: process.env.NODE_ENV === "production", //set to true if using https
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", //allow cookies to be sent with cross-site request
      httpOnly: true, // prevent client side js from acessing the cookie
      maxAge: 24 * 60 * 60 * 1000, // set cookie to expire in 5 minutes
    },
  })
);

app.use(jsonParser);
app.use(urlencodedParser);


app.use(passport.initialize());
app.use(passport.session());





//=================== PASSPORT GOOGLE AUTHENTICATION===================//
passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'/api/auth/googl/callback',
    passReqToCallback   : true
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await user.findOne({ where: { googleId: profile.id } });
    
    if (!user) {
      user = await user.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        role: 'customer'
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));


//=================== SERIALIZATION AND DESERIALIZATION==================//
passport.serializeUser((user,done) =>{
        done(null,user.id);
    });


    passport.deserializeUser(async(id,done)=>{
        try {
            const user = await user.findByPk(id);
            done(null,user);
        } catch (error) {
            done(error,null);
        }
    })



//=================== ROUTES ==================//
    
app.get('/auth/google',
    passport.authenticate('google',{scope:['profile','email']})
);

app.get('/api/auth/google/callback',
    passport.authenticate('google',{failureRedirect:'http://localhost:5173'}),
    (res,req)=>{
        res.redirect('http://localhost:5173')
    }
)






/*API endpoints
POST,/auth/google,"Verify Google token, create/find user, return JWT",No
GET,/products,List ready-made products (filter by size/material),No
POST,/products,Create product (admin),Yes (Admin)
PUT,/products/:id,Update product,Yes (Admin)
DELETE,/products/:id,Delete product,Yes (Admin)
POST,/custom-orders,"Create custom order, calculate price & 50% payment",Yes
GET,/orders,Get user orders,Yes
POST,/payments/initialize,Initialize Paystack transaction (50% or full),Yes
GET,/payments/verify/:reference,"Verify payment, update order status",Yes */


















  //==============================================================================================
app.listen(process.env.PORT, (error) => {
  if (error) {
    console.log("Creation of server failed:", error);
    return;
  }
  console.log("server is listening on port 8080");
});
//==============================================================================================
 
