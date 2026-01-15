// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import { sequelize } from './models/index.js';
//import {User} from './models/User.js'
//import { modelsPromise } from './models/index.js';
import models from './models/index.js'; // Import the promise that resolves to all models


// Import routes
import categoriesRouter from './routes/categories.js';
import materialsRouter from './routes/materials.js';
import stylesRouter from './routes/styles.js';
import productsRouter from './routes/products.js';
import customOrdersRoutes from './routes/customOrders.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payment.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

//console.log('Allowed CORS origins:', allowedOrigins);

//  CORS configuration (MUST be first)
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('Incoming origin:', origin || 'same-origin request');
      
      // Allow requests with no origin (like mobile apps, Postman, or same-origin)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // CRITICAL: Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'], // Expose cookie headers
  })
);

//  Body parser (MUST be before session)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  Session configuration (BEFORE passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh session on every request
    proxy: true, // Trust proxy if behind one
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS only)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production cross-origin, 'lax' for dev
    },
  })
);

//  Passport initialization (AFTER session)
app.use(passport.initialize());
app.use(passport.session());

//  Logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`
  ═══════════════════════════════════════
  ${req.method} ${req.url}
  Session ID: ${req.sessionID}
  Session User: ${req.session.user ? JSON.stringify(req.session.user) : 'None'}
  Authenticated: ${req.isAuthenticated ? req.isAuthenticated() : 'N/A'}
  ═══════════════════════════════════════
  `);
  next();
});

// ============================================
// PASSPORT GOOGLE OAUTH CONFIGURATION
// ============================================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
       const dbModels = models;
        const userModel = dbModels.User;
        let user = await userModel.findOne({ where: { googleId: profile.id } });

        if (!user) {
          user = await userModel.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            role: 'user',
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google auth error:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log('✅ Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const dbModels = models;
    const userModel = dbModels.User;
    const user = await userModel.findByPk(id);
    console.log('✅ Deserialized user:', user ? user.id : 'null');
    done(null, user);
  } catch (error) {
    console.error('❌ Deserialize error:', error);
    done(error, null);
  }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const dbModels = models;
    const userModel =dbModels.User;
    const { name, email, password } = req.body;

    console.log('📝 Registration attempt:', { name, email });

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await userModel.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    // Set user in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log('✅ User registered:', user.email);
    console.log('✅ Session user set:', req.session.user);

    // Force save session
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).json({ message: 'Registration successful but session failed' });
      }

      console.log('✅ Session saved successfully');
      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const dbModels = models;
    const UserModel =dbModels.User;
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await UserModel.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(401).json({
        message: 'This account uses Google login. Please sign in with Google.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Set user in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log('✅ User logged in:', user.email);
    console.log('✅ Session user set:', req.session.user);

    // Force save session
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).json({ message: 'Login successful but session failed' });
      }

      console.log('✅ Session saved successfully');
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Google OAuth Routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Set user in session for consistency
    req.session.user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    };

    console.log('✅ Google OAuth successful:', req.user.email);
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  }
);

// Get current user
app.get('/api/auth/user', (req, res) => {
  console.log('=== GET /api/auth/user ===');
  console.log('Session User:', req.session.user);
  console.log('Passport User:', req.user);

  // Check session first, then passport
  if (req.session && req.session.user) {
    return res.json(req.session.user);
  }

  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json(req.user);
  }

  res.status(401).json({ message: 'Not authenticated' });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    console.log('✅ User logged out');
    res.json({ message: 'Logged out successfully' });
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/categories', categoriesRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/styles', stylesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/custom-orders', customOrdersRoutes);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRoutes)

// ============================================
// DATABASE SYNC AND SERVER START
// ============================================
const PORT = process.env.PORT || 8080;

sequelize
  .sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
      ╔═══════════════════════════════════════╗
      ║   🚀 Server running on port ${PORT}     ║
      ║   📍 http://localhost:${PORT}           ║
      ╚════════════════════════════════════════╝
      `);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });

export default app;