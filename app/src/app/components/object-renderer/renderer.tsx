import type { ReactNode } from 'react';
import { useState } from 'react';
import './style.scss';

export interface ObjectRendererProps {
  header?: ReactNode;
  dataToRender: any;
  onEdit?: (editData: { updated_src: any }) => void;
}

const getValueByPath = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

const setValueByPath = (obj: any, path: string, value: any) => {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
};

const RenderField = ({ value, path, onEdit }: {
  value: any;
  path: string;
  onEdit?: (path: string, newValue: any) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(JSON.stringify(value));

  const handleSave = () => {
    try {
      const parsedValue = JSON.parse(inputValue);
      onEdit?.(path, parsedValue);
      setIsEditing(false);
    } catch (e) {
      console.error('Invalid JSON');
    }
  };

  return isEditing ? (
    <div className="edit-field">
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        autoFocus
      />
      <button onClick={handleSave}>✓</button>
      <button onClick={() => setIsEditing(false)}>✕</button>
    </div>
  ) : (
    <span
      className="editable-value"
      onClick={() => onEdit && setIsEditing(true)}
    >
      {JSON.stringify(value)}
    </span>
  );
};

const renderObject = (
  obj: any,
  onEdit?: (path: string, newValue: any) => void,
  layer: number = 0,
  pathPrefix: string = ''
): ReactNode => {
  const itemType = typeof obj;

  if (itemType === 'object' && obj !== null && !Array.isArray(obj)) {
    return Object.keys(obj).map((key) => {
      const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      return (
        <div
          key={currentPath}
          style={{ paddingLeft: `${layer * 20}px`, marginTop: '4px' }}
        >
          <strong>{key}:</strong>
          {renderObject(obj[key], onEdit, layer + 1, currentPath)}
        </div>
      );
    });
  }

  return (
    <div style={{ display: 'inline-block', marginLeft: '8px' }}>
      <RenderField
        value={obj}
        path={pathPrefix}
        onEdit={onEdit}
      />
      <span className="type-label"> ({itemType})</span>
    </div>
  );
};

export const ObjectRenderer = ({ dataToRender, header, onEdit }: ObjectRendererProps) => {
  const handleFieldEdit = (path: string, newValue: any) => {
    const updated = JSON.parse(JSON.stringify(dataToRender));
    setValueByPath(updated, path, newValue);
    onEdit?.({ updated_src: updated });
  };

  return (
    <div className="object-renderer">
      <h3>{header}</h3>
      {renderObject(dataToRender, handleFieldEdit)}
    </div>
  );
};
