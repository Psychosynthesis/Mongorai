import type { ReactNode } from 'react';
import { useState } from 'react';
import './style.scss';

export interface ObjectRendererProps {
  header?: ReactNode;
  dataToRender: any;
  onEdit?: (editData: { updated_src: any }) => void;
  autoCollapse?: boolean;
  onSelect: (id: any) => void;
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
  const isEditAvailable = typeof onEdit === 'function';

  const handleSave = () => {
    try {
      const parsedValue = JSON.parse(inputValue);
      onEdit?.(path, parsedValue);
      setIsEditing(false);
    } catch (e) {
      console.error('Error on saving. Invalid JSON?');
    }
  };

  return isEditing ? (
    <div className="edit-field">
      <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} autoFocus />
      <button className="button-ok" onClick={handleSave}>✓</button>
      <button className="button-esc" onClick={() => setIsEditing(false)}>✕</button>
    </div>
  ) : (
    <span
      className={isEditAvailable? "editable-value" : "value-text" }
      onClick={() => isEditAvailable && setIsEditing(true)}
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
  const cellClass = onEdit ? 'value-cell-editable' : 'value-cell';

  if (itemType === 'object' && obj !== null && !Array.isArray(obj)) {
    return Object.keys(obj).map((key) => {
      const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      const paddingLeft = layer === 0 ? '10px' : `${layer * 20}px`
      const rowClass = typeof obj[key] === 'object' ? 'object-row has-nested-object' : 'object-row';
      return (
        <div className={rowClass} key={currentPath} style={{ paddingLeft }}>
          <div className="key-cell">{key}:</div>
          {renderObject(obj[key], onEdit, layer + 1, currentPath)}
        </div>
      );
    });
  }

  return (
    <div className={cellClass}>
      <RenderField value={obj} path={pathPrefix} onEdit={onEdit} />
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
      {renderObject(dataToRender, onEdit && handleFieldEdit)}
    </div>
  );
};
