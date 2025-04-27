// src/pages/DocumentPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ObjectRenderer } from '../../components/object-renderer/renderer';
import { Button, Spinner } from 'react-bootstrap';
import { MongoDbService } from '../../services/mongo-db.service';
import { useNotifications } from '../../NotificationsContext';

const DocumentPage: React.FC = () => {
  const { server, database, collection, document } = useParams<{
    server: string;
    database: string;
    collection: string;
    document: string;
  }>();

  const navigate = useNavigate();
  const { notify } = useNotifications();
  const {
    isReadOnly,
    getDocument: fetchDocument,
    update: updateDocument,
    remove: deleteDocument
  } = MongoDbService.useMongoDb();

  const [item, setItem] = useState<any>(null);
  const [readOnly, setReadOnly] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const readOnlyStatus = await isReadOnly();
        setReadOnly(readOnlyStatus);

        if (server && database && collection && document) {
          const doc = await fetchDocument(server, database, collection, document);
          setItem(doc);
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : 'Failed to load document', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [server, database, collection, document]);

  const handleEdit = async (editData: any) => {
    if (!item?._id?.$value || readOnly) return;

    try {
      setLoading(true);
      const updatedDoc = await updateDocument(
        server!,
        database!,
        collection!,
        item._id.$value,
        editData.updated_src,
        false
      );
      setItem(updatedDoc);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    try {
      setLoading(true);
      await deleteDocument(server!, database!, collection!, document);
      navigate(`/servers/${server}/databases/${database}/collections/${collection}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Delete failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="alert alert-warning mt-4">
        Document not found
      </div>
    );
  }

  return (
    <div className="document-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Document Details</h2>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={readOnly}
        >
          Delete Document
        </Button>
      </div>

      <ObjectRenderer
        dataToRender={item}
        onEdit={!readOnly ? handleEdit : undefined}
      />
    </div>
  );
};
/*
Можно попробовать использовать свой компонент:
<PrettyJson
  json={document}
  readOnly={readOnly}
  onEdit={handleUpdate}
  onRemove={handleDelete}
  onGo={handleNavigate}
/>
*/

export default DocumentPage;
