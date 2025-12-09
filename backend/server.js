import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { Sequelize } from "sequelize";
import passport from 'passport';
import bodyParser from 'body-parser';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { createClient } from "redis";
import "./models/index.js";
//const jwt = require('jsonwebtoken');
import connectSessionSequelize from "connect-session-sequelize";
import { modelsPromise } from "./models/index.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

 import paymentsRouter from './routes/Payment.js'


const SequelizeStore = connectSessionSequelize(session.Store);

const {sequelize, User, Products, OrderItems, Orders, CustomOrder} =await modelsPromise;

const app= express();

const client = createClient({url :process.env.REDIS_URL});

client.connect();


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:false}));


//=============COR CONFIGURATION
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
 " http://localhost:8080",
];


app.use(
  cors({
    origin: function (origin, callback) {
      console.log('Incoming origin:', origin || 'undefined(likely same-origin or non browser)');
      if (!origin|| allowedOrigins.includes(origin)) {
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

//log DB TO CONSOLE
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
    await sessionStore.sync();
  } catch (error) {
    console.error(error);
  }
}
await initializeDatabase();





//===========middleware for session
app.use(
  session({
    secret: process.env.SECRET_SESSION || "fallbacksecret", //used to sign session cookies
    resave: false, // resave session if it is not modified
    saveUninitialized: false, // dont save unitialized session
    store: sessionStore, // use the session store created
    cookie: {
      secure: false, //set to true if using https
      sameSite:"none", //allow cookies to be sent with cross-site request
      httpOnly: true, // prevent client side js from acessing the cookie
      maxAge: 24 * 60 * 60 * 1000, // set cookie to expire in 5 minutes
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

//app.use(jsonParser);
//app.use(urlencodedParser);


//=================== PASSPORT GOOGLE AUTHENTICATION===================//
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/api/auth/google/callback",
      passReqToCallback: false,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            role: "customer",
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);


//=================== SERIALIZATION AND DESERIALIZATION==================//
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});



//======= middle to check authentication
const isAuthenticated = ( req,res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "unauthorized" });
};


//======middle to authenticate admin role
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
};

function authenticateToken(req, res, next) {
  console.log("Raw cookie:", req.headers.cookie);
  console.log('Request from:', req.headers.host, req.method);
  const token = req.cookies?.token; // Retrieve token from
  //  httpOnly cookie
  if (!token) {
    return res.status(401).json({ message: "Not Authenticated" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }
    req.user = user; // Attach decoded user to req for use in routes
    next();
  });
}


// Helper function to invalidate cache
async function invalidateUserCache(userId) {
  const keys = await client.keys(`user:${userId}:*`);
  if (keys.length > 0) {
    await client.del(keys);
    console.log(`Invalidated ${keys.length} cache entries for user ${userId}`);
  }
}



//======================= cache implementation =======================
app.get("/api/data", authenticateToken,isAuthenticated, async (req, res) => {
  try {

    const userId = req.user.id;
    const cacheKey = `user:${userId}:data`;

   let data = await client.get(cacheKey);

   if (data) {
      console.log("Cache hit");
      return res.json(JSON.parse(data));
    }

    console.log("Cache miss - Fetching from database");


    //fetching actual data from database
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] }, // exclude sensitive data
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    //prepare response data
    data = {
      user: user.toJSON(),
      message: "Fresh data from database",
    };

    // Simulate slow API call
    await client.set(cacheKey, JSON.stringify(data), { EX: 3600 }); // Expires in 1 hours
    res.json(data);
  } catch (error) {
    console.error("fetching data:", error);
    res.status(500).json({ message: "internal server error" });
  }
});

    //check if user is Authenticated
    //if (!req.isAuthenticated()) {
     // return res.status(401).json({ message: "Not Authenticated" });
    //}
    
  
// cache user's orders
app.get("/api/user/orders", authenticateToken, async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not found" });
    }

    const userId = req.user.id;
    const cacheKey = `user:${userId}:orders`;

    //try cache first
    let cachedOrders = await client.get(cacheKey);
    if (cachedOrders) {
      console.log("cache hit-Orders");
      return res.json(JSON.parse(cachedOrders));
    }
    console.log("cache miss - fetching orders from database");
    // fetch from database
    const orders = await Orders.findAll({
      where: { userId: userId },
      include: [
        {
          model: OrderItems,
          include: [Products],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const data = {
      orders: orders.map((order) => order.toJSON()),
      count: orders.length,
    };

    // cache for 10 munites
    await client.set(cacheKey, JSON.stringify(data), { EX: 600 }); // Expires in 1 hours
    res.json(data);
  } catch (error) {
    console.error("Error fetching orders", error);
    res.status(500).json({ message: "Internal server Error" });
  }
});

//cache products

/// ================= END OF CACHING.  =================

//===================  AUTH ROUTES ==================//

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile","email"] })
);

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: false, //set to true in production with https
    });

    res.redirect("http://localhost:5173");
  }
);

//=====get user=====
app.get("/api/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logout successfully" });
  });
});



// ==================USER END POINT



/*API endpoints
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
    const users = await User.findAll();
    res.json(users)
  } catch (error) {
    console.error("users not found",error);
    res.status(500).json({message:"internal server error"});
  }
});
//GET USER BY ID
app.get('/api/users/:id',async(req,res)=>{
  try {
    const user = await User.findByPk(req.params.id);
     if(!user) return res.status(404).json({error:'user not found'});
     res.json(user);
  } catch (error) {
    res.status(400).json({error:error.message});
  }
});

// POST create user ()
app.post('/api/users', async (req,res)=>{
  try {
    const user = await User.create(req.body);
    res.status(201).json(user)
  } catch (error) {
    res.status(400).json({error:error.message});
  }
});

//PUT update user 
app.put('/api/users/:id',async (req,res) =>{
  try {
    const user = await User.findByPk(req.params.id);
    if(!user) return res.status(404).json({error:'Product not found'});

    await user.update(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({error:error.message});
  }
});

//DELETE user
app.delete('/api/users/:id',async(req,res) =>{
  try {
      const user = await User.findByPk(req.params.id);
      if(!user) return res.status(404).json({error:'User not found'});

      await user.destroy();
      res.json({message:'user deleted successfully'});
  } catch (error) {
    res.status(400).json({error:error.message});
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
app.post('/api/products',isAdmin, async (req,res)=>{
  try {
    const product = await Products.create(req.body);
    res.status(201).json(product)
  } catch (error) {
    res.status(400).json({error:error.message});
  }
});

//PUT update product (admin only)
app.put('/api/products/:id',isAdmin,async (req,res) =>{
  try {
    const product = await Products.findByPk(req.params.id);
    if(!product) return res.status(404).json({error:'Product not found'});

    await product.update(req.body);
    res.json(product);
  } catch (error) {
    res.status(400).json({error:error.message});
  }
});

//DELETE products (admin only)
app.delete('/api/product/:id',isAdmin,async(req,res) =>{
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
  app.get('/api/custom-orders',authenticateToken, async (req,res) =>{
    try {
      const customOrder = await CustomOrder.create({
        ...req.body,
        userId:req.user.id,
        paymentStatus:'pending',
        amountDue: req.body.totalPrice * 0.5 //50% deposit
      });
      res.status(201).json(customOrder);
    } catch (error) {
      res.status(400).json({error:error.message});
    }
  });


//=================== ORDERS ENDPOINTS ==================//

// GET user orders
app.get('/api/orders',authenticateToken, async (req,res) =>{
  try {
    const orders = await Orders.findAll({
      where:{userId:req.user.id},
      include:[OrderItems]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({error:error.message});
  }
})


  //=================== PAYMENT ENDPOINTS  ==================//

 




  app.use('/api/payments', isAuthenticated, paymentsRouter);
  //===============================SERVER LISTEN ===============================================================
app.listen(process.env.PORT, (error) => {
  if (error) {
    console.log("Creation of server failed:", error);
    return;
  }
  console.log("server is listening on port 8080");
});
//==============================================================================================
 
