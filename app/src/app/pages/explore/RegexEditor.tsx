import { useState } from 'react';

interface RegexEditorProps {
  pattern: string;
  options: string;
  onUpdate: (newPattern: string, newOptions: string) => void;
}

export const RegexEditor = ({ pattern, options, onUpdate }: RegexEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputPattern, setPattern] = useState(pattern);
  const [inputOptions, setOptions] = useState(options);

  const save = () => {
    onUpdate(inputPattern, inputOptions);
    setIsEditing(false);
  };

  return isEditing ? (
    <div className="regex-editor">
      <input
        value={inputPattern}
        onChange={(e) => setPattern(e.target.value)}
      />
      <input
        value={inputOptions}
        onChange={(e) => setOptions(e.target.value)}
        placeholder="flags"
      />
      <button onClick={save}>✓</button>
      <button onClick={() => setIsEditing(false)}>✕</button>
    </div>
  ) : (
    <div onClick={() => setIsEditing(true)}>
      /{pattern}/{options}
    </div>
  );
};
