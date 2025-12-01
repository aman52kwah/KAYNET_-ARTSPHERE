import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { Sequelize } from "sequelize";
import passport from 'passport';
import bodyParser from 'body-parser';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {createClient} from 'redis';
//import { sequelize, User } from './models';
import "./models/index.js";
//const jwt = require('jsonwebtoken');
import connectSessionSequelize from "connect-session-sequelize";
import { modelsPromise } from "./models/index.js";

const SequelizeStore = connectSessionSequelize(session.Store);

const {sequelize, User, Products, OrderItems, Orders, CustomOrder} =await modelsPromise;

const app= express();

const client = createClient({ url: process.env.REDIS_URL});

client.connect();

app.get('/api/data', async (req, res) => {
  const cacheKey = 'api:data';

  let data = await client.get(cacheKey);
  if (data) {
    console.log('Cache hit');
    return res.json(JSON.parse(data));
  }

  // Simulate slow API call
  data = { message: 'Fresh data from API' };  // Replace with actual fetch
  await client.set(cacheKey, JSON.stringify(data), { EX: 3600 });  // Expires in 60 seconds

  console.log('Cache miss');
  res.json(data);
});

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

console.log(" DB  CONNECTED SUCESSFULLY");

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

//=====get user=====
app.get('/api/auth/user',(req,res)=>{
  if(req.isAuthenticated()){
    res.json(req.user);
  }else {
    res.status(401).json({message:'not authenticated'})
  }
});


app.post('/api/auth/logout', (req,res) =>{
  req.logout(()=>{
  res.json({message:'logout successfully'});
  });
});


//======= middle to check authentication
const isAuthenticated= (res,req,next)=>{
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({message:'unauthorized'});
};

//======middle to authenticate admin role
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Admin access required' });
};



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



//=========== GET ALL USERS ==================
app.get('/api/users', async( req,res) =>{
  try {
    const user = await User.findAll();
    res.json(user)
  } catch (error) {
    console.error("users not found",error);
    res.status(500).json({message:"internal server error"});
  }
});

//=================== PRODUCTS ENDPOINTS ==================//

// GET all products with optional filters
app.get('/api/products',async (req,res) => {
  try{
    const {size,material}= req.query;
    const where = {};

    if(size) where.size = size;
    if(material) where.material = material;

    const products = await Products.findAll({where});
    res.json(products);
  } catch(error){
    res.status(500).json({error:error.message});
  }
});

// POST create product (admin only)
app.post('/api/products', async (req,res)=>{
  try {
    const product = await Products.create(req.body);
    res.status(201).json(product)
  } catch (error) {
    res.status(400).json({error:error.message});
  }
});

//PUT update product (admin only)
app.put('/api/products/:id',async (req,res) =>{
  try {
    const product = await Products.findByPk(req.params.id);
    if(!product) return res.status(404).json({error:'Product found'});

    await product.update(req.body);
    res.json(product);
  } catch (error) {
    res.status(400).json({error:error.message});
  }
});

//DELETE products (admin only)
app.delete('/api/product/:id',async(req,res) =>{
  try {
      const product = await Products.findByPk(req.params.id);
      if(!product) return res.status(404).json({error:'Product not found'});

      await product.destroy();
      res.json({message:'Product deleted'});
  } catch (error) {
    res.status(400).json({error:error.message});
  }
});

  //=================== CUSTOM ORDERS ENDPOINTS ==================//
  //POST create custom orders
  app.get('/api/custom-orders', async (req,res) =>{
    try {
      const customOrder = await customOrder.create({
        ...req.body,
        userId:req.user.id,
        paymentStatus:'pending',
        amountDue: req.body.totalPrice * 0.5 //50% deposit
      });
      res.status(201).json(customOrder);
    } catch (error) {
      res.status(400).json({error:error.messagwe});
    }
  });










//=================== ORDERS ENDPOINTS ==================//

// GET user orders
app.get('/api/orders', async (req,res) =>{
  try {
    const orders = await Orders.findAll({
      where:{userId:req.id},
      include:[OrderItems]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({error:error.message});
  }
})


  //=================== PAYMENT ENDPOINTS ==================//
  //POST INITIALIZE PAYMENT
  app.post('/api/payments/initialize', async (_req,res) =>{
    try {
      //TODO integrate with Paystack API

      res.json({message:'Payment initialization endpoint '});
      
    } catch (error) {
      res.status(400).json({error:error.message});
    }
  });

  //GET VERIFY PAYMENT
  app.get('/api/payments/verify/:reference', async (req,res) =>{
    try {
      //TODO: Integrate with paystack API
      res.json({message:'Payment verification endpoint'});

    } catch (error) {
      res.status(500).json({error:error.message});
    }
  });









  //==============================================================================================
app.listen(process.env.PORT, (error) => {
  if (error) {
    console.log("Creation of server failed:", error);
    return;
  }
  console.log("server is listening on port 8080");
});
//==============================================================================================
 
