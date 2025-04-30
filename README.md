# Mongorai

MongoDB client for the web. Query your data directly from your browser. You can host it locally,
or anywhere else, for you and your team.

Is blazing fast for all operations, including sort/skip/limit.

Based on the [Huggingface Mongoku](https://github.com/huggingface/Mongoku) project, but the frontend has been completely rewritten in ReactJS, the build process has been significantly simplified, and the number of dependencies has been reduced.

Built on TypeScript/Node.js/React.


### Install & Run (not worked yet)

This is the way Mongoku was installed:

```
# Install
npm install -g mongorai

# Run from your current terminal
mongorai start
```

***Now it's not worked for Mongorai. You need to clone this repo and then run next commands: ***

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

If you want to manually build and run mongorai, just clone this repository and run the following:

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
MONGOKU_DEFAULT_HOST="mongodb://user:password@localhost:27017;localhost:27017"

# Use another port. (Default = 3100)
MONGOKU_SERVER_PORT=8000

# Use a specific file to store hosts (Default = $HOME/.mongoku.db)
MONGOKU_DATABASE_FILE="/tmp/mongoku.db"

# Timeout before falling back to estimated documents count in ms (Default = 5000)
MONGOKU_COUNT_TIMEOUT=1000

# Read-only mode
MONGOKU_READ_ONLY_MODE=true
```
