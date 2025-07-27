#!/usr/bin/env node

import { createCommand } from 'commander';
import * as figlet from 'figlet';
import * as child_process from 'child_process';
import * as path from 'path';

import * as server from './server';

const cyanColor = '\x1b[36m'; // Colors for CLI
const resetColor = '\x1b[0m';
const program = createCommand();

program
  .version(require('../package.json').version) // Cause we run in the "dist" folder
  .usage('start [--pm2] [--forever] [--no-auth]') // Список поддерживаемых опций
  .description('Mongorai - MongoDB client for the web')
  .option('--pm2', 'Run using pm2')
  .option('--forever', 'Run using forever')
  .option('--no-auth', 'Disable basic authentication')
  .action(start)
  .parse(process.argv);

async function start(cmd: 'start', options: any) {
  if (cmd !== "start") {
    return program.help();
  }

  console.log(cyanColor + (figlet.textSync('Mongorai')) + '\n');

  if (options.noAuth) {
    process.env.MONGORAI_NO_AUTH = 'true';
    console.log(`${cyanColor}[Auth]${resetColor} Basic authentication disabled`);
  }

  const pm2 = options.pm2;
  const forever = options.forever;
  const entryPath = path.join(__dirname, 'server.js');
  const authVar = options.noAuth ? 'MONGORAI_NO_AUTH=true ' : '';

  if (pm2 && forever) {
    console.log("Cannot launch with both PM2 and Forever. You need to chose one.");
    console.log(`Use ${cyanColor}'mongorai --help'${resetColor} for more info`);
    process.exit(1);
  }

  if (pm2) {
    // Start for pm2
    child_process.exec(`${authVar}pm2 start --name mongorai ${entryPath}`, (err, stdout, stderr) => {
      if (err) {
        console.warn("Error while launching with pm2: ", err);
      } else {
        console.log(stdout, stderr);
        console.log(`${cyanColor}[Mongorai]${resetColor} Launched with PM2.\nAvailable at http://localhost:3100/`);
      }
    });
    return;
  }

  if (forever) {
    // Start for forever
    child_process.exec(`${authVar}forever --uid mongorai start -a ${entryPath}`, (err, stdout, stderr) => {
      if (err) {
        console.log("Error while launching with forever: ", err);
      } else {
        console.log(stdout, stderr);
        console.log(`${cyanColor}[Mongorai]${resetColor} Launched with forever.\nAvailable at http://localhost:3100/`);
      }
    });
    return;
  }

  await server.start();
}
