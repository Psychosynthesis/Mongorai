import React, { useState } from 'react';
import JsonView from '@uiw/react-json-view';
import { githubDarkTheme } from '@uiw/react-json-view/githubDark';
import { JsonParser } from '../../services/json-parser.service';
import { useNotifications } from '../../NotificationsContext';

import './style.scss';

interface PrettyJsonProps {
  json: any;
  readOnly?: boolean;
  autoCollapse?: boolean;
  onEdit?: (data: any) => void;
  onRemove?: () => void;
  onSelect?: (id: string) => void;
}

const PrettyJson: React.FC<PrettyJsonProps> = ({
  json,
  readOnly = false,
  autoCollapse = false,
  onEdit,
  onRemove,
  onSelect
}) => {
  const { notify } = useNotifications();
  const [removing, setRemoving] = useState(false);

  const customTheme = {
    ...githubDarkTheme,
    backgroundColor: 'var(--color-2)',
    fontFamily: 'var(--font-family)',
    fontSize: '14px',
    margin: '4px 8px',
  };

  const handleEdit = (edit: any) => {
    try {
      const updated = JsonParser.parse(JSON.stringify(edit.value), notify);
      onEdit?.(updated);
    } catch (error) {
      notify('Error updating document', 'error');
    }
  };

  const renderValue = (props: any) => {
    // Кастомный рендер для специальных типов
    const value = props.value;

    if (value?.$type === 'ObjectId') {
      return (
        <span className="object-id">
          ObjectId("{value.$value}")
          {onSelect && (
            <button
              className="btn-go-id"
              onClick={() => onSelect(value.$value)}
            >
              Edit object
            </button>
          )}
        </span>
      );
    }

    if (value?.$type === 'RegExp') {
      return <span className="regex-value">/{value.$value.$pattern}/{value.$value.$flags}</span>;
    }

    return props.defaultRenderer(props);
  };

  return (
    <div className="pretty-json" style={{ padding: '1rem', borderRadius: '4px' }}>
      <div className="toolbar">
        {!readOnly && (
          <button className="btn-remove" onClick={() => setRemoving(true)}>
            Remove Document
          </button>
        )}
      </div>

      <JsonView
        value={json}
        collapsed={autoCollapse ? 2 : false}
        displayDataTypes={true}
        displayObjectSize={true}
        enableClipboard={false}
        style={customTheme}
      >
      </JsonView>

      {removing && (
        <div className="remove-confirm">
          <p>Are you sure you want to delete this document?</p>
          <div className="confirm-actions">
            <button className="btn-confirm" onClick={() => onRemove?.()}>
              Yes, Delete
            </button>
            <button className="btn-cancel" onClick={() => setRemoving(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrettyJson;
