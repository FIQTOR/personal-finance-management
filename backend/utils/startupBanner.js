/**
 * Console helpers for startup output.
 * Kept separate so `index.js` stays focused on wiring.
 */

const COLORS = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
};

/**
 * Print a friendly startup banner.
 * @param {{ env: string, port: number|string }} params
 */
const printStartupBanner = ({ env, port }) => {
    const { reset, blue, green, cyan, yellow } = COLORS;

    console.log('\n┌─────────────────────────────────────────────────┐' + reset);
    console.log('│' + reset + ` 🚀 ${green}API Server is running!${reset}                  │${reset}`);
    console.log('│' + reset + ` 🌐 Environment : ${yellow}${String(env).padEnd(15)}${reset}           │${reset}`);
    console.log('│' + reset + ` 📊 API Version : ${cyan}v1.0.0${reset}                     │${reset}`);
    console.log('├─────────────────────────────────────────────────┤' + reset);

    if (env === 'development') {
        console.log('│' + reset + ` 📡 Local URL   : ${blue}http://localhost:${port}${reset}     │${reset}`);
        console.log('│' + reset + ` 🔗 API Base    : ${blue}http://localhost:${port}/api${reset}  │${reset}`);
    } else {
        console.log('│' + reset + ` 📡 Port        : ${blue}${port}${reset}                     │${reset}`);
        console.log('│' + reset + ` 🔗 API Base    : ${blue}/api${reset}                       │${reset}`);
    }

    console.log('└─────────────────────────────────────────────────┘' + reset + '\n');
};

module.exports = { printStartupBanner };
