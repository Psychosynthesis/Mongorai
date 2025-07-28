import { MongoManager } from './MongoManager';
import { HostsManager } from './HostsManager';

const cyanColor = '\x1b[36m'; // Colors for CLI
const resetColor = '\x1b[0m';

class Factory {
  private get _initializedError() {
    return new Error("HostsManager or MongoManager is not exist. Init.load() must be called first");
  }

  private _mongoManager: MongoManager;
  private _hostsManager: HostsManager;

  get mongoManager() {
    if (!this._mongoManager) {
      throw this._initializedError;
    }
    return this._mongoManager;
  }

  get hostsManager() {
    if (!this._hostsManager) {
      throw this._initializedError;
    }
    return this._hostsManager;
  }

  async load() {
    console.log(`${cyanColor}[Mongorai]${resetColor} Start init local DB managers`)
    // Start by initializing the host manager (needed for mongo manager)
    this._hostsManager = new HostsManager();
    await this._hostsManager.load();

    // Then we can initialize the mongo manager
    this._mongoManager = new MongoManager();
    await this._mongoManager.load();
    console.log(`${cyanColor}[Mongorai]${resetColor} Local DB managers inited successfully`)
  }
}

export const Init = new Factory();
export default Init;
