import express from 'express';
import cors from 'cors';
import path from 'path';
import { inspect } from 'node:util'; // Встроенный модуль для обработки циклических структур

import { Init } from './lib/index.js';
import { api } from './routes/index.js';
import { basicAuth } from './middlewares/index.js';

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

const cyanColor = '\x1b[36m'; // Colors for CLI
const resetColor = '\x1b[0m';

const server = express();

const errHandler: ErrorRequestHandler = (err: unknown, _: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const status = (err as any)?.status || 500; // Get err status
    const message = (err instanceof Error) ? err.message : 'Unknown error';
    if (status === 500) {
      console.error('Unhandled error:', inspect(err, { depth: null, colors: true }));
    } else {  // Logging
      console.warn(`Get ${status} error on serverside. ${message}`, inspect(err, { depth: 2, colors: true }));
    }

    // Стандартизированный ответ с учетом статуса
    res.status(status).json({
        ok: false,
        message: status === 500
            ? 'Internal server error. Please contact support.'
            : message,
        errorId: Date.now()
    });
};

const setupServer = () => {
  const SERVER_PORT = process.env.MONGORAI_SERVER_PORT || 3100;
  server.use(cors());
  server.use('/api', basicAuth, api);
  // Обслуживание статических файлов React
  server.use(basicAuth, express.static('dist/front/'));

  // Fallback для фронтенд-роутов
  server.get('*', basicAuth, (_, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/front/index.html'));
  });
  server.use(errHandler);

  server.listen(SERVER_PORT, () => console.log(`${cyanColor}[Mongorai]${resetColor} listening on port ${SERVER_PORT}`));
}

export const start = async () => {
  console.log(`${cyanColor}[Mongorai]${resetColor} Starting...`);
  try {
    await Init.load();
    setupServer();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  (async () => {
    await start();
  })();
}
