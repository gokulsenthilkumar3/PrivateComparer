import React, { useState } from 'react';
import DiffEditor from './DiffEditor';
import { type DiffOptions } from './Sidebar';
import { Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SqlCompareProps {
  options: DiffOptions;
}

const SqlCompare: React.FC<SqlCompareProps> = ({ options }) => {
  const [originalValue, setOriginalValue] = useState('');
  const [modifiedValue, setModifiedValue] = useState('');
  const [validationResult, setValidationResult] = useState<{status: string, message: string} | null>(null);

  // Very basic SQL formatter block for client side since we don't have sql-formatter npm package
  const basicSqlFormat = (sql: string) => {
    let formatted = sql.replace(/\s+/g, ' ');
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE'];
    
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${kw.toUpperCase()}`);
    });
    
    return formatted.replace(/^\n/, '').trim();
  };

  const checkBasicSyntax = (sql: string) => {
    if (!sql.trim()) return true;
    const upper = sql.toUpperCase();
    if (!upper.includes('SELECT') && !upper.includes('INSERT') && !upper.includes('UPDATE') && !upper.includes('DELETE') && !upper.includes('CREATE') && !upper.includes('DROP') && !upper.includes('ALTER')) {
      return false; // Very basic check
    }
    return true;
  };

  const handleFormat = () => {
    let error = '';

    if (!checkBasicSyntax(originalValue) && originalValue.trim()) {
      error += 'Original input does not look like valid SQL. ';
    }
    if (!checkBasicSyntax(modifiedValue) && modifiedValue.trim()) {
      error += 'Changed input does not look like valid SQL.';
    }

    if (error) {
       setValidationResult({ status: 'warning', message: error });
    } else {
       setValidationResult({ status: 'success', message: 'SQL valid. Formatting applied.' });
    }

    if (originalValue.trim()) setOriginalValue(basicSqlFormat(originalValue));
    if (modifiedValue.trim()) setModifiedValue(basicSqlFormat(modifiedValue));
  };

  const overrideOptions = { ...options, syntax: 'sql' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Database size={18} className="text-accent" /> SQL Compare & Checker
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           {validationResult && (
            <div style={{ fontSize: '0.8125rem', color: validationResult.status === 'warning' ? 'var(--yellow)' : 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {validationResult.status === 'warning' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
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

export default SqlCompare;
