import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Init } from '../lib/index.js';
import { writeEnabled } from '../middlewares/index.js';

import type { Request, Response, NextFunction } from 'express';

export const api = express.Router();

// get readOnly
api.get('/readonly', async (_, res: Response) => {
  return res.json({
    ok: true,
    readOnly: (process.env.MONGORAI_READ_ONLY_MODE === 'true'),
  });
});

// Get servers
api.get('/servers', async (_, res: Response) => {
  const servers = await Init.mongoManager.getServersJson();
  return res.json(servers);
});

api.put('/servers', bodyParser.json(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Init.hostsManager.add(req.body.url);
    await Init.mongoManager.load();
  } catch (err) {
    return next(err);
  }

  return res.json({
    ok: true
  });
});

api.delete('/servers/:server', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Init.hostsManager.remove(req.params.server);
    Init.mongoManager.removeServer(req.params.server);
  } catch (err) {
    return next(err);
  }

  return res.json({
    ok: true
  });
});

api.get('/servers/:server/databases', async (req: Request, res: Response, next: NextFunction) => {
  const server = req.params.server;

  try {
    const databases = await Init.mongoManager.getDatabasesJson(server);
    return res.json(databases);
  } catch (err) {
    return next(err);
  }
});

api.get('/servers/:server/databases/:database/collections', async (req: Request, res: Response, next: NextFunction) => {
  const server   = req.params.server;
  const database = req.params.database;

  try {
    const collections = await Init.mongoManager.getCollectionsJson(server, database);
    return res.json(collections);
  } catch (err) {
    return next(err);
  }
});

api.get('/servers/:server/databases/:database/collections/:collection/documents/:document', async (req: Request, res: Response, next: NextFunction) => {
  const server     = req.params.server;
  const database   = req.params.database;
  const collection = req.params.collection;
  const document   = req.params.document;

  try {
    const c = await Init.mongoManager.getCollection(server, database, collection);
    if (!c) {
      return next(new Error(`Collection not found: ${server}.${database}.${collection}`));
    }

    const doc = await c.findOne(document);
    if (!doc) {
      return next(new Error("This document does not exist"));
    }

    return res.json({
      ok:       true,
      document: doc
    });
  } catch (err) {
    return next(err);
  }
});

api.post(
  '/servers/:server/databases/:database/collections/:collection/documents/:document', writeEnabled, bodyParser.json(),
  async (req: Request, res: Response, next: NextFunction) => {
    const server     = req.params.server;
    const database   = req.params.database;
    const collection = req.params.collection;
    const document   = req.params.document;
    const partial    = req.query.partial === 'true';

    try {
      const c = await Init.mongoManager.getCollection(server, database, collection);
      if (!c) {
        return next(new Error(`Collection not found: ${server}.${database}.${collection}`));
      }
      const update = await c.updateOne(document, req.body, partial);

      return res.json({
        ok:     true,
        update: update
      });
    } catch (err) {
      return next(err);
    }
  }
)

api.delete('/servers/:server/databases/:database/collections/:collection/documents/:document', writeEnabled, async (req: Request, res: Response, next: NextFunction) => {
  const server     = req.params.server;
  const database   = req.params.database;
  const collection = req.params.collection;
  const document   = req.params.document;

  try {
    const c = await Init.mongoManager.getCollection(server, database, collection);
    if (!c) {
      return next(new Error(`Collection not found: ${server}.${database}.${collection}`));
    }

    await c.removeOne(document);

    return res.json({
      ok: true
    });
  } catch (err) {
    return next(err);
  }
});

api.get('/servers/:server/databases/:database/collections/:collection/query', async (req: Request, res: Response, next: NextFunction) => {
  const server     = req.params.server;
  const database   = req.params.database;
  const collection = req.params.collection;

  // Обработка dbQuery
  let dbQuery = (!req.query?.q || req.query?.q === '') ? {} : req.query.q;
  // Если запрос не передан - используем пустой объект

  if (typeof dbQuery !== "object") {
    try {
      // Приводим к строке на случай нестроковых значений
      dbQuery = JSON.parse(String(dbQuery));
    } catch (err) {
      return next(new Error(`Invalid query: ${dbQuery}`));
    }
  }

  // Остальные параметры (без изменений)
  let sort = req.query.sort || "{}";
  if (sort && typeof sort !== "object") {
    try {
      sort = JSON.parse(sort);
    } catch (err) {
      return next(new Error(`Invalid order: ${sort}`));
    }
  }

  let project = req.query.project || "";
  if (project && typeof project !== "object") {
    try {
      project = JSON.parse(project);
    } catch (err) {
      return next(new Error(`Invalid project: ${project}`));
    }
  }

  let limit = parseInt(req.query.limit as string, 10);
  if (isNaN(limit)) { limit = 20; }
  let skip = parseInt(req.query.skip as string, 10);
  if (isNaN(skip)) { skip = 0; }

  const findedCollection = await Init.mongoManager.getCollection(server, database, collection);
  if (!findedCollection) {
    return next(new Error(`Collection not found: ${server}.${database}.${collection}`));
  }

  try {
    // Теперь dbQuery гарантированно объект
    const results = await findedCollection.find(dbQuery, project, sort, limit, skip);

    return res.json({
      ok:      true,
      results: results
    });
  } catch (err) {
    return next(err);
  }
});

api.get('/servers/:server/databases/:database/collections/:collection/count', async (req: Request, res: Response, next: NextFunction) => {
  const server     = req.params.server;
  const database   = req.params.database;
  const collection = req.params.collection;

  let query = req.query.q;
  if (typeof query !== "object") {
    try {
      query = JSON.parse(query as string);
    } catch (err) {
      return next(new Error(`Invalid query: ${query}`));
    }
  }

  const findedCollection = await Init.mongoManager.getCollection(server, database, collection);
  if (!findedCollection) {
    return next(new Error(`Collection not found: ${server}.${database}.${collection}`));
  }

  try {
    const count = await findedCollection.count(query);

    return res.json({
      ok:    true,
      count: count
    });
  } catch (err) {
    return next(err);
  }
});
