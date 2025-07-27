import React from 'react';
import { bytesFormatter } from '../../tools/format';

import './style.scss';

type PopoverData =
  | { type: 'collection'; data: Array<{ name: string; size: number }>; clipped?: number }
  | { type: 'stats'; data: { avgObjSize: number; dataSize: number; storageSize: number; totalIndexSize: number; }};

interface PopoverProps {
  left: number;
  top: number;
  data: PopoverData;
}

export const Popover: React.FC<PopoverProps> = ({ left, top, data }) => {
  return (
    <div
      className="popover-container"
      style={{
        left: `${left}px`,
        top: `${top}px`
      }}
    >
      {data.type === 'collection' ? (
        <div>
          <div className="popover-header">
            <span className="popover-header-title">Collection</span>
            <span className="popover-header-title">Size</span>
          </div>
          {data.data.map((collection) => (
            <div key={collection.name} className="popover-grid">
              <span className="popover-grid-item">{collection.name}</span>
              <span>{bytesFormatter(collection.size)}</span>
            </div>
          ))}
          {data.clipped && (
            <div className="clipped-info">
              {data.clipped} more collections...
            </div>
          )}
        </div>
      ) : (
        <div className="stats-container">
          <div className="stats-row">Average object size:</div>
          <div className="stats-row">{bytesFormatter(data.data.avgObjSize)}</div>

          <div className="stats-row">Data size:</div>
          <div className="stats-row">{bytesFormatter(data.data.dataSize)}</div>

          <div className="stats-row">Storage size:</div>
          <div className="stats-row">{bytesFormatter(data.data.storageSize)}</div>

          <div className="stats-row">Index size:</div>
          <div className="stats-row">{bytesFormatter(data.data.totalIndexSize)}</div>
        </div>
      )}
    </div>
  );
};
