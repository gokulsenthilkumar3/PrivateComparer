import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import DiffEditor from './DiffEditor';
import { type DiffOptions } from './Sidebar';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@\${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface DocumentCompareProps {
  options: DiffOptions;
}

const DocumentCompare: React.FC<DocumentCompareProps> = ({ options }) => {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setter(text);
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setter(result.value);
      } else {
        const text = await file.text();
        setter(text);
      }
    } catch (err) {
      console.error('Failed to parse document:', err);
      alert('Could not parse the document file.');
    }
    setLoading(false);
  };

  if (originalText && modifiedText) {
    return (
      <DiffEditor 
        options={options} 
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
           <FileText size={28} className="text-accent" />
           <h2 className="text-2xl font-semibold">Compare PDF & Word Documents</h2>
        </div>
        
        <div className="flex w-full gap-4">
          <label className="flex-1 border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-dim transition-all">
            <Upload size={32} className="text-muted mb-4" />
            <span className="font-medium">Upload Original Document</span>
            <span className="text-xs text-muted mt-2">.pdf, .docx, .txt</span>
            <input type="file" accept=".pdf, .docx, .txt" hidden onChange={e => handleFileUpload(e, setOriginalText)} />
            {originalText && <span className="mt-4 text-green font-bold">Loaded ✓</span>}
          </label>
          
          <label className="flex-1 border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent-dim transition-all">
            <Upload size={32} className="text-muted mb-4" />
            <span className="font-medium">Upload Changed Document</span>
            <span className="text-xs text-muted mt-2">.pdf, .docx, .txt</span>
            <input type="file" accept=".pdf, .docx, .txt" hidden onChange={e => handleFileUpload(e, setModifiedText)} />
            {modifiedText && <span className="mt-4 text-green font-bold">Loaded ✓</span>}
          </label>
        </div>
        {loading && <div className="mt-6 text-muted">Parsing files...</div>}
      </div>
    </div>
  );
};

export default DocumentCompare;
