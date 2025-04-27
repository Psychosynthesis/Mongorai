import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';

import { MongoDbService } from '../../services/mongo-db.service';
import SearchBox from '../../components/search-box/searchbox';
import ReactJson from '../../components/pretty-json/prettyjson';
import { useNotifications } from '../../NotificationsContext';
import { JsonParser } from '../../services/json-parser.service';

import type { SearchParams } from '../../components/search-box/searchbox';

import './explore.scss';

const ExplorePage: React.FC = () => {
  const { server, database, collection } = useParams<{
    server: string;
    database: string;
    collection: string
  }>();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { notify } = useNotifications();
  const {
    isReadOnly, query: queryCollection, count: countDocuments, update: updateDocument, remove: removeDocument
  } = MongoDbService.useMongoDb();

  const [readOnly, setReadOnly] = useState(true);

  const [params, setParams] = useState<SearchParams>({
    query: searchParams.get('query') || '{}',
    project: searchParams.get('project') || '{}',
    sort: searchParams.get('sort') || '{}',
    skip: parseInt(searchParams.get('skip') ?? '0'),
    limit: parseInt(searchParams.get('limit') ?? '20')
  });

  const [loading, setLoading] = useState({ content: true, count: true });
  const [count, setCount] = useState({ total: 0, start: 0 });
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const checkReadOnly = async () => {
      const isReadOnlyFlag = await isReadOnly();
      setReadOnly(isReadOnlyFlag);
    };

    const loadData = async () => {
      await checkReadOnly();
      update();
    };

    loadData();
  }, [server, database, collection]);

  const update = async (updateUrl = true) => {
    try {
      const parsedQuery = params.query ? JsonParser.parse(params.query, notify) : {};
      const parsedSort = params.sort ? JsonParser.parse(params.sort, notify) : {};
      const parsedProject = params.project ? JsonParser.parse(params.project, notify) : {};

      if (updateUrl) {
        const newParams = new URLSearchParams({
          query: params.query || '',
          sort: params.sort || '',
          project: params.project || '',
          skip: params.skip.toString(),
          limit: params.limit.toString()
        });
        setSearchParams(newParams);
      }

      setLoading({ content: true, count: true });
      setItems([]);
      setCount(prev => ({ ...prev, total: 0 }));

      // Загрузка документов
      const queryResult = await queryCollection(
        server!,
        database!,
        collection!,
        parsedQuery,
        parsedProject,
        parsedSort,
        params.skip,
        params.limit
      );

      if (Array.isArray(queryResult)) {
        setItems(queryResult);
        setLoading(prev => ({ ...prev, content: false }));
      }

      // Подсчет документов
      const countResult = await countDocuments(
        server!,
        database!,
        collection!,
        JSON.stringify(parsedQuery)
      );

      if (countResult) {
        setCount({ total: countResult, start: params.skip });
        setLoading(prev => ({ ...prev, count: false }));
      }

    } catch (error) {
      notify(error instanceof Error ? error.message : 'Failed to load data', 'error');
      setLoading({ content: false, count: false });
    }
  };

  const handleSearchChange = (newParams: Partial<typeof params>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  const goToDocument = (documentId: string) => {
    navigate(`/servers/${server}/databases/${database}/collections/${collection}/documents/${documentId}`);
  };

  const handleEdit = async (id: string, newData: any) => {
    if (readOnly) return;

    try {
      const partial = !!params.project && Object.keys(JsonParser.parse(params.project, notify)).length > 0;

      await updateDocument(
        server!,
        database!,
        collection!,
        id, // document Id
        newData, // update data (body)
        partial // partial flag (url param)
      );

      setItems(prev => prev.map(item =>
        item._id?.$value === id ? { ...item, ...newData } : item
      ));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Update failed', 'error');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeDocument(server!, database!, collection!, id);
      setItems(prev => prev.filter(item => item._id?.$value !== id));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Delete failed', 'error');
    }
  };

  const paginationControls = (
    <div className="d-flex justify-content-between align-items-center my-3">
      <div className="summary">
        {count.total > 0 && (
          <span>
            {count.start + 1} - {count.start + items.length} of {count.total}
          </span>
        )}
        <span> Documents</span>
      </div>

      <div className="actions">
        <Button
          variant="outline-secondary"
          onClick={previous}
          disabled={!hasPrevious}
          className="me-2"
        >
          Previous
        </Button>
        <Button
          variant="outline-secondary"
          onClick={next}
          disabled={!hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div className="explore-component">
      <SearchBox params={params} onChange={handleSearchChange} onSearch={update} />

      {!loading.count && paginationControls}

      {loading.content ? (
        <div className="text-center my-5">
          <Spinner animation="border" />
        </div>
      ) : (
        items.map((item, index) => (
          <div key={index} className="my-3">
            <ReactJson
              json={item}
              autoCollapse={true}
              onEdit={!readOnly ? e => handleEdit(item._id?.$value, e.updated_src) : undefined}
              onRemove={!readOnly ? () => handleRemove(item._id?.$value) : undefined}
              onSelect={e => item._id?.$value && goToDocument(item._id.$value)}
            />
          </div>
        ))
      )}
    </div>
  );
};

// Вспомогательные функции для пагинации
const hasNext = (count: number, start: number, items: any[], limit: number) =>
  start + items.length < count;

const next = (params: any, setParams: React.Dispatch<any>, update: () => void) => {
  const newSkip = params.skip + params.limit;
  setParams(prev => ({ ...prev, skip: newSkip }));
  update();
};

const hasPrevious = (start: number) => start > 0;

const previous = (params: any, setParams: React.Dispatch<any>, update: () => void) => {
  const newSkip = Math.max(0, params.skip - params.limit);
  setParams(prev => ({ ...prev, skip: newSkip }));
  update();
};

export default ExplorePage;
