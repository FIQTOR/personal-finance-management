/**
 * Main application file for the FIQTOR API
 * Express server, security middlewares, and routes
 */

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const sequelize = require('./config/database');
const cors = require('cors');
const apiRoutes = require('./routes');
const path = require('path');

const helmet = require('./middlewares/helmet');
const logger = require('./middlewares/logger');
const rateLimiter = require('./middlewares/rateLimiter');

const dotenv = require('dotenv');
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const envFile = env === "production" ? ".env" : `.env.${env}`;
dotenv.config({ path: envFile, override: true });

const app = express();
const port = process.env.PORT || 4000;

// Security & Utility Middlewares
app.use(helmet);
app.use(logger);
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 1000 }));

app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_HOST || 'http://localhost:3000'
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static('uploads'));

app.use('/api', apiRoutes);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

console.log('🔌 Connecting to the database...');
sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connected successfully!');

        app.listen(port, () => {
            const reset = "\x1b[0m";
            const blue = "\x1b[34m";
            const green = "\x1b[32m";
            const cyan = "\x1b[36m";
            const yellow = "\x1b[33m";

            console.log("\n" + "┌─────────────────────────────────────────────────┐" + reset);
            console.log("│" + reset + ` 🚀 ${green}IARTY API Server is running!${reset}             │${reset}`);
            console.log("│" + reset + ` 🌐 Environment : ${yellow}${env.padEnd(15)}${reset}           │${reset}`);
            console.log("│" + reset + ` 📊 API Version : ${cyan}v1.0.0${reset}                     │${reset}`);
            console.log("├─────────────────────────────────────────────────┤" + reset);

            if (env === "development") {
                console.log("│" + reset + ` 📡 Local URL   : ${blue}http://localhost:${port}${reset}     │${reset}`);
                console.log("│" + reset + ` 🔗 API Docs    : ${blue}http://localhost:${port}/api${reset}  │${reset}`);
            } else {
                console.log("│" + reset + ` 📡 Port        : ${blue}${port}${reset}                     │${reset}`);
                console.log("│" + reset + ` 🔗 API Endpoint: ${blue}/api${reset}                       │${reset}`);
            }

            console.log("└─────────────────────────────────────────────────┘" + reset + "\n");
        });
    })
    .catch((error) => {
        console.error('❌ Error connecting to the database:', error);
        process.exit(1);
    });

module.exports = app;
