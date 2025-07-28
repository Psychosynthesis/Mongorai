import React, { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import { ObjectRenderer, type CustomRenderer } from 'rendrui';

import { useNotifications } from '../../NotificationsContext';
import { MongoDbService } from '../../services/mongo-db.service';
import { JsonParser } from '../../services/json-parser.service';

import { SearchBox } from '../../components/';

import { RegexEditor } from './RegexEditor';

import type { SearchParams } from '../../components/search-box/searchbox';

import './explore.scss';

const regexRenderer: CustomRenderer = {
  match: (value, path) =>
    (value && typeof value === 'object' && ('$regex' in value)) ||
    path?.endsWith('patterns]'), // Условие для массива паттернов
  render: ({ value, path, onEdit }) => {
    const pattern = value.$regex || value.source;
    const options = value.$options || value.flags || '';

    const handleUpdate = (newPattern: string, newOptions: string) => {
      onEdit?.(path, { $regex: newPattern, $options: newOptions });
    };

    return <RegexEditor
      pattern={pattern}
      options={options}
      onUpdate={handleUpdate}
    />;
  }
};

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
  const [displayCount, setCount] = useState({ total: 0, start: 0 }); // Для пагинации
  const [items, setItems] = useState<any[]>([]);

  // Для пагинации
  const hasPrevious = params.skip > 0;
  const hasNext = params.skip + params.limit < displayCount.total;

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
      // setCount(prev => ({ ...prev, total: 0 }));

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

  const checkReadOnly = async () => {
    const isReadOnlyFlag = await isReadOnly();
    setReadOnly(isReadOnlyFlag);
  };

  const loadData = async () => {
    await checkReadOnly();
    update();
  }


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

  const goToLast = () => {
    const newSkip = Math.max(0, displayCount.total - params.limit);
    setParams({ ...params, skip: newSkip });
  };

  const goToDocument = (documentId: string) => {
    navigate(`/servers/${server}/databases/${database}/collections/${collection}/documents/${documentId}`);
  };

  useEffect(() => {
    loadData();
  }, [server, database, collection]);

  useEffect(() => {
    update();
  }, [params.query, params.query, params.query, params.project, params.skip, params.limit]);

  return (
    <div className="explore-component">
      <SearchBox
        params={params}
        onChange={(newParams: Partial<typeof params>) => { setParams(prev => ({ ...prev, ...newParams })) }}
        onSearch={update}
      />

      <div className="pagination-controls">
        <div className="summary">
          {loading.count && <>...</>}
          {!loading.count && (
            <>
              <span>
                {displayCount.start + 1} - {displayCount.start + items.length} of {displayCount.total}
              </span>
              <span> Documents</span>
            </>
          )}
        </div>

        <div className="actions">
          <Button variant="outline-secondary" onClick={() => setParams({ ...params, skip: Math.max(0, params.skip - params.limit) })} disabled={!hasPrevious}>
            Previous
          </Button>
          <Button variant="outline-secondary" onClick={() => setParams({ ...params, skip: params.skip + params.limit })} disabled={!hasNext}>
            Next
          </Button>
          <Button  variant="outline-secondary"  onClick={goToLast} disabled={params.skip + params.limit >= displayCount.total || displayCount.total === 0}>
            Last Page
          </Button>
        </div>
      </div>

      {loading.content ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        items.map((item, index) => (
          <div key={index} className="collection-item">
            <div className="item-control-row">
              <Button className="remove-button" onClick={() => handleRemove(item._id?.$value)}>Remove item</Button>
            </div>
            <ObjectRenderer
              dataToRender={item}
              autoCollapse={true}
              customRenderers={[regexRenderer]}
              onEdit={!readOnly ? e => handleEdit(item._id?.$value, e.updated_src) : undefined}
              onSelect={() => item._id?.$value && goToDocument(item._id.$value)}
            />
          </div>
        ))
      )}
    </div>
  );
};

export default ExplorePage;
