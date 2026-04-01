import React, { useState } from 'react';
import DiffEditor from './DiffEditor';
import { type DiffOptions } from './Sidebar';
import { Braces, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface JsonCompareProps {
  options: DiffOptions;
}

const JsonCompare: React.FC<JsonCompareProps> = ({ options }) => {
  const [originalValue, setOriginalValue] = useState('');
  const [modifiedValue, setModifiedValue] = useState('');
  const [validationResult, setValidationResult] = useState<{status: string, message: string} | null>(null);

  const handleFormat = () => {
    let orig = originalValue;
    let mod = modifiedValue;
    let error = '';

    try {
      if (orig.trim()) orig = JSON.stringify(JSON.parse(orig), null, 2);
    } catch (e: any) {
      error += `Original JSON Error: ${e.message}. `;
    }

    try {
      if (mod.trim()) mod = JSON.stringify(JSON.parse(mod), null, 2);
    } catch (e: any) {
      error += `Changed JSON Error: ${e.message}.`;
    }

    if (error) {
       setValidationResult({ status: 'error', message: error });
    } else {
       setValidationResult({ status: 'success', message: 'Valid JSON. Formatted successfully!' });
       setOriginalValue(orig);
       setModifiedValue(mod);
    }
  };

  const overrideOptions = { ...options, syntax: 'json' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Braces size={18} className="text-accent" /> JSON Compare & Checker
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {validationResult && (
            <div style={{ fontSize: '0.8125rem', color: validationResult.status === 'error' ? 'var(--red)' : 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {validationResult.status === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              {validationResult.message}
            </div>
          )}
          <button className="btn btn-primary" onClick={handleFormat} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
            Validate & Format
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <DiffEditor 
          options={overrideOptions}
          originalValue={originalValue}
          modifiedValue={modifiedValue}
          onOriginalChange={(v) => { setOriginalValue(v); setValidationResult(null); }}
          onModifiedChange={(v) => { setModifiedValue(v); setValidationResult(null); }}
        />
      </div>
    </div>
  );
};

export default JsonCompare;
