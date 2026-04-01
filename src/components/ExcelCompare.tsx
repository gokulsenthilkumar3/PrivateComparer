import React, { useState } from 'react';
import { Upload, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import DiffEditor from './DiffEditor';
import { type DiffOptions } from './Sidebar';

interface ExcelCompareProps {
  options: DiffOptions;
}

const ExcelCompare: React.FC<ExcelCompareProps> = ({ options }) => {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        // Use the first sheet for simplicity
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // Convert to CSV for diffing
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        setter(csv);
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        alert('Could not parse the Excel file.');
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  if (originalText && modifiedText) {
    return (
      <DiffEditor 
        options={{...options, disableWrap: true}} 
        originalValue={originalText}
        modifiedValue={modifiedText}
        onOriginalChange={setOriginalText}
        onModifiedChange={setModifiedText}
      />
    );
  }

  return (
    <div className="input-area fade-in flex items-center justify-center p-8 bg-primary">
      <div className="flex flex-col items-center max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-8">
           <Table size={28} className="text-accent" />
           <h2 className="text-2xl font-semibold">Compare Excel & CSV Files</h2>
        </div>
        
        <div className="flex w-full gap-4">
          <label className="flex-1 border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-dim transition-all">
            <Upload size={32} className="text-muted mb-4" />
            <span className="font-medium">Upload Original Spreadsheet</span>
            <span className="text-xs text-muted mt-2">.xlsx, .xls, .csv</span>
            <input type="file" accept=".xlsx, .xls, .csv" hidden onChange={e => handleFileUpload(e, setOriginalText)} />
            {originalText && <span className="mt-4 text-green font-bold">Loaded ✓</span>}
          </label>
          
          <label className="flex-1 border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-dim transition-all">
            <Upload size={32} className="text-muted mb-4" />
            <span className="font-medium">Upload Changed Spreadsheet</span>
            <span className="text-xs text-muted mt-2">.xlsx, .xls, .csv</span>
            <input type="file" accept=".xlsx, .xls, .csv" hidden onChange={e => handleFileUpload(e, setModifiedText)} />
            {modifiedText && <span className="mt-4 text-green font-bold">Loaded ✓</span>}
          </label>
        </div>
        {loading && <div className="mt-6 text-muted">Parsing files...</div>}
      </div>
    </div>
  );
};

export default ExcelCompare;
