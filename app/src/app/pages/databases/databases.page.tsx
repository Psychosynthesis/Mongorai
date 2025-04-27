import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DatabaseJSON, MongoDbService } from '../../services/mongo-db.service';

import { bytesFormatter } from '../../tools/format';
import { Popover } from '../../components';

import './databases.scss';

const DatabasesPage: React.FC = () => {
  const { server } = useParams<{ server: string }>();
  const { getDatabases } = MongoDbService.useMongoDb();
  const [databases, setDatabases] = useState<DatabaseJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState<{ type: 'collection' | 'stats'; data: any; clipped?: number; position: { x: number; y: number }; } | null>(null);

  useEffect(() => {
    if (!server) return;

    const loadDatabases = async () => {
      try {
        const data = await getDatabases(server);
        setDatabases(data);
      } finally {
        setLoading(false);
      }
    };

    loadDatabases();
  }, [server, getDatabases]);

  const handleCellHover = (e: React.MouseEvent, type: 'collection' | 'stats', data: any, clipped?: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({
      type, data, clipped, position: { x: rect.left + window.scrollX, y: rect.top + window.scrollY + rect.height }
    });
  };

  return (
    <div className="databases-component">
      <h2>{server} Databases</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Collections</th><th>Size</th>
          </tr>
        </thead>
        <tbody>
          {databases.map((database) => (
            <tr style={{ borderBottom: '1px solid #e0e0e0' }} key={database.name}>
              <td>
                <Link to={`/servers/${server}/databases/${database.name}/collections`} style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
                  {database.name}
                </Link>
              </td>
              <td
                style={{ position: 'relative' }}
                onMouseEnter={(e) => {
                  const clippedCollections = database.collections.slice(0, 20);
                  const clpedCount = database.collections.length > 20 ? database.collections.length - 20 : undefined;
                  handleCellHover(e, 'collection', clippedCollections, clpedCount); // Почему clpedCount именно 20?
                }}
                onMouseLeave={() => setPopover(null)}
              >
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  {database.collections.length}
                </span>
              </td>
              <td
                style={{ position: 'relative' }}
                onMouseEnter={(e) => handleCellHover(e, 'stats', database)}
                onMouseLeave={() => setPopover(null)}
              >
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  {bytesFormatter(database.size)}
                </span>
              </td>
            </tr>
          ))}

            <tr>
              <td colSpan={3} className="noDataCell">
                {!loading && databases.length === 0 && 'No databases found'}
                {loading && 'Loading databases...'}
              </td>
            </tr>
        </tbody>
      </table>

      {popover && (
        <Popover
          left={popover.position.x}
          top={popover.position.y}
          data={popover.type === 'collection' ?
            { type: 'collection', data: popover.data, clipped: popover.clipped } :
            { type: 'stats', data: {
              avgObjSize: popover.data.avgObjSize,
              dataSize: popover.data.dataSize,
              storageSize: popover.data.storageSize,
              totalIndexSize: popover.data.totalIndexSize
            }}
          }
        />
      )}
    </div>
  );
};

export default DatabasesPage;
