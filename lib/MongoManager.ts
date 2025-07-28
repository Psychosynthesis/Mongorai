import { URL } from 'url';
import { MongoClient, MongoError } from 'mongodb';

import { Init } from './Init';
import { Host } from './HostsManager';
import { Server, ServerJSON, ServerErrorJSON } from './Server';
import { DatabaseJSON } from './Database';
import { Collection, CollectionJSON } from './Collection';
import { Utils } from './Utils';

export type Servers = (ServerJSON | ServerErrorJSON)[]

export class MongoManager {
  private _servers: {
    [name: string]: Server | MongoError;
  } = {};

  private async connect(host: Host) {
    const urlStr = host.path.startsWith('mongodb')
      ? host.path
      : `mongodb://${host.path}`;
    const url = new URL(urlStr);
    const hostname = url.host || host.path;

    if (this._servers[hostname] instanceof Server) {
      return;
    }

    try {
      const client = new MongoClient(urlStr);
      await client.connect();
      const server = new Server(hostname, client);
      this._servers[hostname] = server;
      console.info(`[${hostname}] Connected to ${hostname}`);
      await this.checkAuth(hostname);
    } catch (err: unknown) {
      console.error(`Error while connecting to ${hostname}:`,
        err instanceof Error ? err.message : 'Unknown error');

      this._servers[hostname] = err instanceof MongoError
        ? err
        : new MongoError(err instanceof Error ? err.message : 'Unknown connection error');
    }
  }

  private getServer(name: string): Server | MongoError {
    const server = this._servers[name] || this._servers[`${name}:27017`];
    if (!server) {
      throw new Error('Server does not exist');
    }
    return server;
  }

  private async checkAuth(name: string) {
    const server = this.getServer(name);
    if (server instanceof MongoError) {
      return;
    }

    try {
      await server.toJson();
    } catch (err: unknown) {
      // Правильная проверка для ошибок аутентификации MongoDB
      if (err instanceof MongoError && err.code === 13) {
        this._servers[name] = err;
      }
    }
  }

  async load() {
    const hosts = await Init.hostsManager.getHosts();
    await Promise.all(hosts.map((h) => this.connect(h)));
  }

  removeServer(name: string) {
    delete this._servers[name];
  }

  async getServersJson(): Promise<Servers> {
    const servers: Servers = [];
    for (const [name, server] of Object.entries(this._servers)) {
      if (server instanceof MongoError) {
        servers.push({
          name: name,
          error: {
            code:    server.code,
            name:    server.name,
            message: server.message
          }
        });
      } else {
        try {
          const json = await server.toJson();
          servers.push(json);
        } catch (err) {
          servers.push({
            name: name,
            error: {
              code:    err instanceof MongoError ? err.code : undefined,
              name:    'ServerError',
              message: err instanceof Error ? err.message : 'Unknown error'
            }
          });
        }
      }
    }
    Utils.fieldSort(servers, "name");
    return servers;
  }

  async getDatabasesJson(serverName: string): Promise<DatabaseJSON[]> {
    const server = this.getServer(serverName);
    if (server instanceof MongoError) {
      return [];
    }

    try {
      const json = await server.toJson();
      return json.databases;
    } catch {
      return [];
    }
  }

  async getCollectionsJson(serverName: string, databaseName: string): Promise<CollectionJSON[]> {
    const server = this.getServer(serverName);
    if (server instanceof MongoError) {
      return [];
    }

    try {
      const database = await server.database(databaseName);
      if (!database) return [];

      const json = await database.toJson();
      return json.collections;
    } catch {
      return [];
    }
  }

  async getCollection(serverName: string, databaseName: string, collectionName: string): Promise<Collection | undefined> {
    const server = this.getServer(serverName);
    if (server instanceof MongoError) return;

    try {
      const database = await server.database(databaseName);
      return database ? await database.collection(collectionName) : undefined;
    } catch {
      return undefined;
    }
  }
}
