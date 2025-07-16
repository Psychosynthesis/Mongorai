import express from 'express';
import { inspect } from 'node:util'; // Встроенный модуль для обработки циклических структур

import factory from './lib/Factory';
import { api } from './routes/api';

import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

const cyanColor = '\x1b[36m'; // Colors for CLI
const resetColor = '\x1b[0m';

const server = express();

const errHandler: ErrorRequestHandler = (err: unknown, _: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const status = (err as any)?.status || 500; // Get err status
    const message = (err instanceof Error) ? err.message : 'Unknown error';
    console.error('Unhandled error:', inspect(err, { depth: null, colors: true })); // Logging

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

  server.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.sendFile("front/index.html", { root: __dirname }, (err) => {
      if (err) {
        return next(err);
      }
    });
  });

  server.use('/', express.static('dist/front/'));
  server.use('/api', api);
  server.use(errHandler);

  server.listen(SERVER_PORT, () => console.log(`${cyanColor}[Mongorai]${resetColor} listening on port ${SERVER_PORT}`));
}

export const start = async () => {
  console.log(`${cyanColor}[Mongorai]${resetColor} Starting...`);
  try {
    await factory.load();
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
