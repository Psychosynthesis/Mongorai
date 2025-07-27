import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { ServerJSON, MongoDbService } from '../../services/mongo-db.service'; // Предполагается адаптация сервиса

import './servers.scss';

const ServersPage: React.FC = () => {
  const [servers, setServers] = useState<ServerJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newServer, setNewServer] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerJSON | null>(null);
  const [popoverData, setPopoverData] = useState<{ collection: any[]; clipped: number } | null>(null);

  const { getServers, addServer, removeServer } = MongoDbService.useMongoDb(); // Используем статический метод

  useEffect(() => {
    refreshServers();
  }, []);

  const refreshServers = async () => {
    setLoading(true);
    try {
      const data = await getServers(); // Адаптировать вызовы API
      if (Array.isArray(data)) setServers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = async () => {
    try {
      await addServer(newServer);
      setNewServer('');
      setAdding(false);
      refreshServers();
    } catch (error) {
      console.error('Error adding server:', error);
    }
  };

  const handleRemoveServer = async (server: ServerJSON) => {
    try {
      await removeServer(server.name);
      refreshServers();
    } catch (error) {
      console.error('Error removing server:', error);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const DatabasePopover = (
    <Popover>
      <Popover.Body>
        <Table size="sm">
          <thead>
            <tr>
              <th>Database</th><th>Collections</th><th>Size</th>
            </tr>
          </thead>
          <tbody>
            {popoverData?.collection.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.collections.length}</td>
                <td>{item.size}</td> {/* Добавить форматирование */}
              </tr>
            ))}
            {popoverData?.clipped && (
              <tr>
                <td colSpan={3}>{popoverData.clipped} more items...</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="servers-component">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2>Servers</h2>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => setAdding(!adding)}>
              {adding ? 'Cancel' : 'Add Server'}
            </Button>
          </div>
        </div>

        {adding && (
          <div className="d-flex gap-2 mt-3">
            <input
              type="text"
              className="form-control"
              placeholder="user:password@hostname:port"
              value={newServer}
              onChange={(e) => setNewServer(e.target.value)}
            />
            <Button variant="success" onClick={handleAddServer} disabled={!newServer.length || loading}>
              Add
            </Button>
          </div>
        )}
      </div>

      <Table hover>
        <thead>
          <tr>
            <th>Name</th><th>Databases</th><th>Size</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server) => (
            <tr key={server.name}>
              <td>
                {server.error ? (
                  <span className="text-danger">
                    <span className="badge bg-danger">Error</span>
                    {server.name}
                  </span>
                ) : (
                  <Link to={`/servers/${encodeURIComponent(server.name)}/databases`}>
                    {server.name}
                  </Link>
                )}
              </td>
              <td>
                {server.databases && (
                  <OverlayTrigger
                    trigger="hover"
                    placement="right"
                    overlay={DatabasePopover}
                    onEnter={() => {
                      const clipped = server.databases.slice(0, 20);
                      setPopoverData({
                        collection: clipped,
                        clipped: server.databases.length - clipped.length,
                      });
                    }}
                  >
                    <span className="text-decoration-underline" role="button">
                      {server.databases.length}
                    </span>
                  </OverlayTrigger>
                )}
              </td>
              <td>{server.size}</td>
              <td>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => {
                    setSelectedServer(server);
                    setShowDeleteModal(true);
                  }}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}

          {servers.length === 0 && !loading && (
            <tr>
              <td colSpan={4} className="text-center">
                No servers found
              </td>
            </tr>
          )}

          {loading && (
            <tr>
              <td colSpan={4} className="text-center">
                Loading...
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Body>
          <p>Are you sure you want to remove this server? This will only remove it from the list.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => selectedServer && handleRemoveServer(selectedServer)}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ServersPage;
