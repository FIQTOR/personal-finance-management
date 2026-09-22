/**
 * Main application file.
 *
 * Wires together security middleware, routes and error handling. All
 * configuration is read from the centralised `config/env.js` loader which
 * validates required variables (fail-fast) before we get here.
 */
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const path = require('path');

const env = require('./config/env');
const sequelize = require('./config/database');
const apiRoutes = require('./routes');

const securityHeaders = require('./middlewares/securityHeaders');
const logger = require('./middlewares/logger');
const rateLimiter = require('./middlewares/rateLimiter');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const { printStartupBanner } = require('./utils/startupBanner');

const app = express();

// Behind a reverse proxy / load balancer, trust the first proxy so that
// req.ip reflects the real client address (used by the rate limiter).
app.set('trust proxy', 1);

// --- Security & utility middleware -------------------------------------------
app.use(securityHeaders);
app.use(logger);
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 1000 }));

app.use(cors({
    credentials: true,
    origin: env.CORS_ORIGINS,
}));

app.use(cookieParser());
// Basic request-size guard (multer handles file limits separately).
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (!env.SESSION_SECRET && env.isProduction) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  SESSION_SECRET is not set in production. Sessions will not be secure.');
}

app.use(session({
    secret: env.SESSION_SECRET || 'dev-only-insecure-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
    },
}));

app.use(passport.initialize());
app.use(passport.session());

// Static uploads (profile avatars uploaded directly to the server).
app.use('/uploads', express.static('uploads'));

// --- Views -------------------------------------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Routes ------------------------------------------------------------------
app.use('/api', apiRoutes);

// 404 for unknown API routes, then the central error handler.
app.use(notFound);
app.use(errorHandler);

// --- Bootstrap ---------------------------------------------------------------
const startServer = async () => {
    console.log('🔌 Connecting to the database...');
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully!');

        app.listen(env.PORT, () => printStartupBanner({ env: env.NODE_ENV, port: env.PORT }));
    } catch (error) {
        console.error('❌ Error connecting to the database:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
