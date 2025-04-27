import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CollectionJSON, MongoDbService } from '../../services/mongo-db.service';

import { bytesFormatter } from '../../tools/format';
import { Popover } from '../../components';

import './style.scss';

const CollectionsPage: React.FC = () => {
  const { server, database } = useParams<{ server: string; database: string }>();
  const { getCollections } = MongoDbService.useMongoDb();
  const [collections, setCollections] = useState<CollectionJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState<{
    type: 'indexes' | 'stats';
    data: any;
    clipped?: number;
    position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    if (!server || !database) return;
    const loadCollections = async () => {
      try {
        const data = await getCollections(server, database);
        setCollections(data);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [server, database]);

  const indexNameFormatter = (raw: string) => {
    let parts = raw.replace(/_id/g, "$id").split('_');
    const indexes: Record<string, number> = {};
    while (parts.length > 0) {
      const field = parts.shift()?.replace(/\$id/g, "_id") || '';
      const direction = parseInt(parts.shift() || '1', 10) || 1;
      indexes[field] = direction;
    }
    return JSON.stringify(indexes, null, 2);
  };

  const handleCellHover = (e: React.MouseEvent, type: 'indexes' | 'stats', data: any, clipped?: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      type, data, clipped, position: { x: rect.left + window.scrollX, y: rect.top + window.scrollY + rect.height }
    });
  };

  return (
    <div className="collections-component">
      <h2 className="header">{database} Collections</h2>
      <table className="collections-table">
        <thead>
          <tr>
            <th>Name</th><th>Documents</th><th>Indexes</th><th>Size</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection) => (
            <tr key={collection.name}>
              <td>
                <Link
                  to={`/servers/${server}/databases/${database}/collections/${collection.name}`}
                  className="collection-link"
                >
                  {collection.name}
                </Link>
              </td>
              <td>{collection.count.toLocaleString()}</td>
              <td
                className="hover-cell"
                onMouseLeave={() => setPopover(null)}
                onMouseEnter={(e) => {
                  const indexes = Object.entries(collection.indexSizes).map(([name, size]) => ({ name, size })).slice(0, 20);
                  const clipSize = Object.keys(collection.indexSizes).length - indexes.length;
                  handleCellHover(e, 'indexes', indexes, clipSize);
                }}
              >
                <span className="hover-target">
                  {collection.nIndexes}
                </span>
              </td>
              <td
                className="hover-cell"
                onMouseEnter={(e) => handleCellHover(e, 'stats', collection)}
                onMouseLeave={() => setPopover(null)}
              >
                <span className="hover-target">
                  {bytesFormatter(collection.size)}
                </span>
              </td>
            </tr>
          ))}

          <tr>
            <td colSpan={4} className="status-cell">
              {loading && 'Loading...'}
              {!loading && collections.length === 0 && 'No collections found'}
            </td>
          </tr>
        </tbody>
      </table>

      {popover && (
        <Popover
          left={popover.position.x}
          top={popover.position.y}
          data={popover.type === 'indexes' ?
            {
              type: 'collection',
              data: popover.data.map((index: any) => ({ name: indexNameFormatter(index.name), size: index.size })),
              clipped: popover.clipped
            } :
            {
              type: 'stats',
              data: { avgObjSize: popover.data.avgObjSize, dataSize: popover.data.dataSize, storageSize: popover.data.storageSize, totalIndexSize: popover.data.totalIndexSize }
            }
          }
        />
      )}
    </div>
  );
};

export default CollectionsPage;
