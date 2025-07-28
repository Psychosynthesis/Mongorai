import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as util from 'util';
import Nedb from 'nedb';

export interface Host {
  path: string;
}

const DEFAULT_HOSTS = process.env.MONGORAI_DEFAULT_HOST ? process.env.MONGORAI_DEFAULT_HOST.split(';') : ['localhost:27017'];
const DATABASE_FILE = process.env.MONGORAI_DATABASE_FILE || path.join(os.homedir(), '.mongorai.db');

export class HostsManager {
  // Инициализируем свойство null, это соответствует поведению Nedb (ошибка будет null при успешном выполнении)
  private _db: Nedb | null = null;

  private promise(fn: any) {
    return util.promisify(fn.bind(this._db));
  }

  async load() {
    let first = false;
    try {
      await fs.promises.stat(DATABASE_FILE);
    } catch (err) {
      first = true;
    }

    this._db = new Nedb({
      filename: DATABASE_FILE
    });

    const load = this.promise(this._db.loadDatabase);
    await load();

    if (first) {
      await Promise.all(DEFAULT_HOSTS.map(async hostname => {
        const insert: any = this.promise(this._db!.insert);
        return await insert({
          path: hostname
        });
      }));
    }
  }

  getHosts(): Promise<Host[]> {
    return new Promise<Host[]>((resolve, reject) => {
      // Проверка инициализации
      if (!this._db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Тип ошибки Error | null
      this._db.find({}, (err: Error | null, hosts: Host[]) => {
        if (err) {
          return reject(err);
        }
        else {
          return resolve(hosts);
        }
      });
    });
  }

  async add(path: string): Promise<void> { // TODO добавить проверку формата path
    return new Promise<void>((resolve, reject) => {
      // Проверка инициализации
      if (!this._db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Тип ошибки Error | null
      this._db.update({
        path: path
      }, {
        $set: {
          path: path
        }
      }, { upsert: true }, (err: Error | null) => {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  }

  async remove(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Проверка инициализации
      if (!this._db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this._db.remove({
        path: new RegExp(`${path}`)
      }, (err: Error | null) => {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      });
    });
  }
}
