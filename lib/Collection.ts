import * as MongoDb from 'mongodb';
import JsonEncoder from './JsonEncoder';

export interface CollectionJSON {
  name: string;
  size: number;
  dataSize: number;
  count: number;
  avgObjSize: number;
  storageSize: number;
  capped: boolean;
  nIndexes: number;
  totalIndexSize: number;
  indexSizes: {
    [name: string]: number;
  }
}

export class Collection {
  private _collection: MongoDb.Collection;
  private countTimeout = parseInt(process.env.MONGORAI_COUNT_TIMEOUT!, 10) || 5000;

  get name() {
    return this._collection.collectionName;
  }

  constructor(collection: MongoDb.Collection) {
    this._collection = collection;
  }

  async findOne(document: string) {
    const obj = await this._collection.findOne({
      _id: new MongoDb.ObjectId(document)
    })
    return JsonEncoder.encode(obj);
  }

  find(query: any, project: any, sort: any, limit: number, skip: number) {
    return this._collection.find(JsonEncoder.decode(query))
      .project(project)
      .sort(JsonEncoder.decode(sort))
      .limit(limit)
      .skip(skip)
      .map((obj) => {
        return JsonEncoder.encode(obj);
      })
      .toArray();
  }

  async updateOne(document: string, newObj: any, partial: boolean) {
    const newValue = JsonEncoder.decode(newObj);

    // TODO: For now it makes it impossible to remove fields from object with a projection
    const update = partial ? { '$set':newValue } : JsonEncoder.decode(newValue);
    await this._collection.replaceOne({
      _id: new MongoDb.ObjectId(document)
    }, update);

    return JsonEncoder.encode(newValue);
  }

  async removeOne(document: string) {
    await this._collection.deleteOne({
      _id: new MongoDb.ObjectId(document)
    });
  }

  async count(query: any) {
    if (query) {
      let decoded;
      try {
        decoded = JsonEncoder.decode(query);
      } catch (e) {
        throw e;
      }
      if (
        decoded &&
        typeof decoded === 'object' &&
        !Array.isArray(decoded) &&
        Object.keys(decoded).length > 0
      ) {
        return this._collection.countDocuments(decoded, {
          maxTimeMS: this.countTimeout
        }).catch(_ => this._collection.estimatedDocumentCount());
      }
    }
    return this._collection.estimatedDocumentCount();
  }

  async toJson(): Promise<CollectionJSON> {
    let stats = {
      size: 0,
      count: 0,
      avgObjSize: 0,
      storageSize: 0,
      capped: false,
      nindexes: 0,
      totalIndexSize: 0,
      indexSizes: {}
    };

    try {
      stats = await this._collection.stats();
    } catch (err) { };

    return {
      name:           this.name,
      size:           (stats.storageSize || 0) + (stats.totalIndexSize || 0),
      dataSize:       stats.size,
      count:          stats.count,
      avgObjSize:     stats.avgObjSize || 0,
      storageSize:    stats.storageSize || 0,
      capped:         stats.capped,
      nIndexes:       stats.nindexes,
      totalIndexSize: stats.totalIndexSize || 0,
      indexSizes:     stats.indexSizes
    };
  }
}
