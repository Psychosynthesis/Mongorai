#!/usr/bin/env node

import { createCommand } from 'commander';
import figlet from 'figlet';
import * as child_process from 'child_process';
import path from 'path';

import * as server from './server.js';

const cyanColor = '\x1b[36m'; // Colors for CLI
const magentaColor = '\x1b[35m';
const resetColor = '\x1b[0m';
const program = createCommand();

program.version(require('../package.json').version) // Cause we run in the "dist" folder

program.command('start') // Явно регистрируем команду 'start'
  .usage('start [--pm2] [--forever] [--auth] [--pass]') // Список поддерживаемых опций
  .description('Start the Mongorai - MongoDB client for the web')
  .option('--pm2', 'Run using pm2')
  .option('--forever', 'Run using forever')
  .option('--auth', 'Enable basic authentication')
  .option('--pass <password>', 'Set password for basic auth')
  .action(start); // Теперь action привязан только к команде 'start'

program.parse(process.argv);

// Обновите сигнатуру функции start (уберите параметр cmd):
async function start(options: any) {
  console.log(cyanColor + (figlet.textSync('Mongorai')) + '\n');

  const pm2 = options.pm2;
  const forever = options.forever;
  const entryPath = path.join(__dirname, 'server.js');
  let authVar = options.auth ? 'MONGORAI_ENABLE_AUTH=true ' : '';

  if (authVar || process.env.MONGORAI_ENABLE_AUTH) {
    process.env.MONGORAI_ENABLE_AUTH = 'true';
    console.log(`${cyanColor}[Auth]${resetColor} Basic authentication enabled`);
    if (!options.pass && !process.env.MONGORAI_PASS) {
      console.log(`${magentaColor}[Auth]${resetColor} Auth is enabled but MONGORAI_PASS env variable didn't set! Mongorai will use default (check it in dock's) `);
    } else if (options.pass) {
      authVar += `MONGORAI_PASS=${options.pass} `;
    }
  }

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
