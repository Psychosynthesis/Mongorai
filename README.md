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

Built on TypeScript/Node.js/React.


### Install & Run

This is the way Mongoku was installed:

```
# Install
npm install -g mongorai

# Run from your current terminal
mongorai start
```

Other way is just cloning this repo, install deps and run it locally:

```
npm i
npm run server
```

You can also run Mongorai as a daemon, using either [PM2](https://github.com/Unitech/pm2) or
[Forever](https://github.com/foreverjs/forever).

```
mongorai start --pm2
# or
mongorai start --forever
```

### Manual Build

If you want to manually build and run Mongorai, just clone this repository and run the following:

```bash
# Install the angular cli if you don't have it already
npm install

# Build the front
cd app
npm run install
npm run build

# And the back
cd ..
tsc

# Run
node dist/server.js
```

### Configuration (old config)

You can also specify a few things using environment variables:
```
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
