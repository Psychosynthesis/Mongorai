import React, { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';

import './style.scss';

export type SearchParams = {
  query: string;
  sort: string;
  project: string;
  limit: number;
  skip: number;
};

const SearchBox: React.FC<{
  params: SearchParams;
  onChange: (params: Partial<SearchParams>) => void;
  onSearch: () => void;
}> = ({ params, onChange, onSearch }) => {
  const [dropdownShow, setDropdown] = useState(false);
  const toggleDropdown = () => { setDropdown(!dropdownShow); }

  const [show, setShow] = useState({ limit: false, skip: false, sort: false, project: false });

  const defaults: SearchParams = {
    query: "{}",
    project: "{}",
    limit: 20,
    skip: 0,
    sort: ""
  };

  const toggleField = (field: keyof typeof show) => {
    setShow(prev => ({ ...prev, [field]: !prev[field] }));
    if (params[field] !== defaults[field]) {
      onChange({ [field]: defaults[field] });
    }
  };

  const canAddFields = () => {
    return Object.values(show).some(v => !v);
  };

  return (
    <div className="search-box">
      <div className="search-row">
        <Form.Control
          placeholder="Query"
          value={params.query}
          onChange={e => onChange({ query: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
        />

        <Button disabled={!canAddFields()} onClick={toggleDropdown}>+</Button>

        <Button variant="primary" onClick={onSearch}>
          GO!
        </Button>

        {dropdownShow &&
          <div className="custom-dropdown-menu">
            {!show.sort && <div onClick={() => toggleField('sort')}>Sort</div>}
            {!show.skip && <div onClick={() => toggleField('skip')}>Skip</div>}
            {!show.limit && <div onClick={() => toggleField('limit')}>Limit</div>}
            {!show.project && <div onClick={() => toggleField('project')}>Project</div>}
          </div>
        }
      </div>

      {show.sort && (
        <InputGroup>
          <Form.Control
            placeholder="Sort"
            value={params.sort}
            onChange={e => onChange({ sort: e.target.value })}
          />
          <Button variant="outline-danger" onClick={() => toggleField('sort')}>
            &times;
          </Button>
        </InputGroup>
      )}

      {show.skip && (
        <InputGroup>
          <Form.Control
            type="number"
            placeholder="Skip"
            value={params.skip}
            onChange={e => onChange({ skip: Number(e.target.value) })}
          />
          <Button variant="outline-danger" onClick={() => toggleField('skip')}>
            &times;
          </Button>
        </InputGroup>
      )}

      {show.limit && (
        <InputGroup>
          <Form.Control
            type="number"
            placeholder="Limit"
            value={params.limit}
            onChange={e => onChange({ limit: Number(e.target.value) })}
          />
          <Button variant="outline-danger" onClick={() => toggleField('limit')}>
            &times;
          </Button>
        </InputGroup>
      )}

      {show.project && (
        <InputGroup>
          <Form.Control
            placeholder="Project"
            value={params.project}
            onChange={e => onChange({ project: e.target.value })}
          />
          <Button variant="outline-danger" onClick={() => toggleField('project')}>
            &times;
          </Button>
        </InputGroup>
      )}
    </div>
  );
};

export default SearchBox;
