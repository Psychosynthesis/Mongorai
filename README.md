# Mongorai

Light MongoDB client for the web. Minimalistic UI used React with minimum dependencies.

```

• ▌ ▄ ·.        ▐ ▄  ▄▄ •       ▄▄▄   ▄▄▄· ▪  
·██ ▐██ ▪▪     •█▌▐█▐█ ▀        █  █·▐█ ▀█ ██
▐█ ▌▐▌▐█· ▄█▀▄ ▐█▐▐▌▄█ ▀█▄ ▄█▀▄ ▐▀▀▄ ▄█▀▀█ ▐█·
██ ██▌▐█▌▐█▌.▐▌██▐█▌▐█▄▪▐█▐█▌ ▐▌▐█ █▌▐█ ▪▐▌▐█
▀▀  █ ▀▀▀ ▀█▄▀▪▀▀ █▪·▀▀▀▀  ▀█▄▀▪.▀  ▀ ▀  ▀ ▀▀▀

```

Query your data directly from your browser. You can host it locally,
or anywhere else, for you and your team.

Is blazing fast for all operations, including sort/skip/limit.

Based on the [Huggingface Mongoku](https://github.com/huggingface/Mongoku) project, but the frontend has been completely rewritten in ReactJS, the build process has been significantly simplified, and the number of dependencies has been reduced. Also updated some dependencies to improve security.

## Improvements over Mongoku
 - Added HTTP Basic Auth.
 - Built full on TypeScript/Node.js/React.
 - Reduced number of dependencies
 - Simplified code assembly




## Install & Run

This is the two ways Mongoku can be installed:

```bash
# Install
npm install -g mongorai

# Run from your current terminal
mongorai start
```

Other way is just cloning this repo, install deps and run it locally:

```bash
npm i
npm run server
```

After install you can also run Mongorai as a daemon, using either [PM2](https://github.com/Unitech/pm2) or
[Forever](https://github.com/foreverjs/forever).

```bash
mongorai start --pm2
# or
mongorai start --forever
```

## Options
Run `mongorai` with the environment variable MONGORAI_NO_AUTH to disable Basic Auth:
```bash
mongorai start --no-auth
```

**If you use basic authentication, don't forget to change the password by setting the variable MONGORAI_PASS:**
```bash
MONGORAI_PASS="your_strong_pass" mongorai start
```

Default credentials is:
```bash
Username = mongorai
Pass = default-front-pass
```

### Manual Build

If you want to manually build and run Mongorai, just clone this repository and run the following:

```bash
# Install the angular cli if you don't have it already
npm install

# Build the front
cd front
npm run install
npm run build

# And the back
cd ..
npm run build

# Run
node dist/server.js
# or
npm run server
```

### Configuration
You can also specify a few things using environment variables:
```bash
# Use some customized default hosts (Default = localhost:27017)
MONGORAI_DEFAULT_HOST="mongodb://user:password@localhost:27017;localhost:27017"

# Use another port. (Default = 3100)
MONGORAI_SERVER_PORT=8000

# Use a specific file to store hosts (Default = $HOME/.mongorai.db)
MONGORAI_DATABASE_FILE="/tmp/mongorai.db"

# Timeout before falling back to estimated documents count in ms (Default = 5000)
MONGORAI_COUNT_TIMEOUT=1000

# Read-only mode
MONGORAI_READ_ONLY_MODE=true
```

## TODO
 - Remove Bootstrap from frontend
 - Enable `"strict": true` in tsconfig for stricter typing
 - Resolve the issue with outdated `nedb` in dependencies
 - Consider passing `{ origin: allowedOrigins, credentials: true }` to cors()
