import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

export interface Host {
  /**
   * Стабильный идентификатор записи хоста.
   * Внутренний id записи в локальном хранилище HostsManager.
   * Зачем нужен:
   * - отличать записи как сущности;
   * - стабильно использовать host в UI, списках, key, selected state;
   * - удалять/обновлять конкретную запись без привязки только к path;
   * - сохранить совместимость с прежним форматом NeDB, где _id создавался автоматически.
   */
  _id: string;
  path: string;
}

type StoredHost = {
  _id?: unknown;
  path?: unknown;

  /**
   * NeDB при удалении мог оставлять tombstone-записи:
   * { _id: "...", "$$deleted": true }
   *
   * Если их не учитывать, можно случайно восстановить удалённые записи
   * при чтении старого .db-файла.
   */
  $$deleted?: boolean;
};

const DEFAULT_HOSTS = process.env.MONGORAI_DEFAULT_HOST ? process.env.MONGORAI_DEFAULT_HOST.split(';') : ['localhost:27017'];
const DATABASE_FILE = process.env.MONGORAI_DATABASE_FILE || path.join(os.homedir(), '.mongorai.db');

export class HostsManager {
  // _id здесь является основным идентификатором записи.
  // path — это значение хоста, но не id записи.
  private _hosts: Map<string, Host> = new Map();

  async load(): Promise<void> {
    let first = false;

    try {
      await fs.promises.stat(DATABASE_FILE);
    } catch (err) {
      first = true;
    }

    if (!first) {
      await this._loadFromFile();
    }

    if (first || this._hosts.size === 0) {
      // Инициализируем дефолтные хосты при первом запуске или если файл существует, но валидных записей в нём нет.
      for (const hostname of DEFAULT_HOSTS) {
        const host: Host = {
          _id: this._generateId(),
          path: hostname
        };

        this._hosts.set(host._id, host);
      }

      await this._saveToFile();
    }
  }

  private async _loadFromFile(): Promise<void> {
    const content = await fs.promises.readFile(DATABASE_FILE, 'utf8');

    // Формат хранения совместим с NeDB, один JSON-документ на строку.
    // Пример: {"path":"localhost:27017","_id":"abc123"}
    const hosts = new Map<string, Host>();

    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) { continue; }

      let record: StoredHost;

      try {
        record = JSON.parse(line);
      } catch (err) {
        // Пропускаем битые строки, чтобы один повреждённый документ
        // не ломал загрузку всего списка хостов.
        console.error('Check database file, line looks corrupted: ', line);
        continue;
      }

      const id = typeof record._id === 'string' ? record._id : undefined;

      if (record.$$deleted === true) {
        // Поддержка NeDB tombstone. Если запись с таким _id была удалена, убираем её из результата.
        if (id) { hosts.delete(id); }
        continue;
      }

      if (typeof record.path !== 'string') { continue; }

      const hostPath = record.path.trim();

      if (!hostPath) { continue; }

      const hostId = id || this._generateId();

      // Если читается старый или вручную изменённый файл без _id, генерируем id автоматически.
      // По дефолту каждая запись обязана иметь _id.
      hosts.set(hostId, { _id: hostId, path: hostPath });
    }

    /**
     * Сохраняем старое поведение add():
     * один и тот же path не должен дублироваться.
     *
     * Если в файле почему-то есть несколько записей с одинаковым path,
     * оставляем последнюю прочитанную.
     */
    const uniqueByPath = new Map<string, Host>();

    for (const host of hosts.values()) {
      uniqueByPath.set(host.path, host);
    }

    this._hosts = new Map(
      Array.from(uniqueByPath.values()).map(host => [host._id, host])
    );
  }

  private async _saveToFile(): Promise<void> {
    const lines = Array.from(this._hosts.values()).map(host => {
      /**
       * Сохраняем _id обязательно.
       * Это стабильный id локальной записи хоста.
       */
      return JSON.stringify({
        _id: host._id,
        path: host.path
      });
    });

    const content = lines.length > 0
      ? `${lines.join('\n')}\n`
      : '';

    // Пишем через временный файл. Это безопаснее, чем писать напрямую в DATABASE_FILE:
    // меньше риск получить частично повреждённый файл при падении процесса.
    const tempFile = `${DATABASE_FILE}.${process.pid}.tmp`;
    await fs.promises.writeFile(tempFile, content, 'utf8');
    await fs.promises.rename(tempFile, DATABASE_FILE);
  }

  private _generateId(): string {
    // NeDB использовал строковые id.
    // Оставляем похожий формат: 16 alphanumeric символов.
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(16);
    let result = '';

    for (const byte of bytes) {
      result += chars[byte % chars.length];
    }

    return result;
  }

  async getHosts(): Promise<Host[]> {
    return Array.from(this._hosts.values());
  }

  async add(hostPath: string): Promise<void> { // TODO добавить проверку формата path
    // Сохраняем старое поведение NeDB update + upsert:
    // если host с таким path уже есть — ничего не дублируем.
    const alreadyExists = Array.from(this._hosts.values()).some(host => host.path === hostPath);

    if (!alreadyExists) {
      const host: Host = { _id: this._generateId(), path: hostPath };
      this._hosts.set(host._id, host);
    }

    await this._saveToFile();
  }

  async remove(hostPath: string): Promise<void> {
    const toRemove: string[] = [];

    for (const host of this._hosts.values()) {
      if (host.path === hostPath) {
        toRemove.push(host._id);
        continue;
      }

      try {
        const regex = new RegExp(hostPath);

        if (regex.test(host.path)) {
          toRemove.push(host._id);
        }
      } catch (err) {
        console.error('Check hostPath in database file, path looks corrupted: ', host.path);
        // Если hostPath невалиден как RegExp,
        // точное совпадение уже было проверено выше.
      }
    }

    for (const id of toRemove) { this._hosts.delete(id); }
    await this._saveToFile();
  }
}
