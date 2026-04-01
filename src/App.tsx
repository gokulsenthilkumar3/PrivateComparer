import React, { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';
import Header, { type TabType } from './components/Header';
import Sidebar, { type DiffOptions } from './components/Sidebar';
import DiffEditor from './components/DiffEditor';
import ImageCompare from './components/ImageCompare';
import DocumentCompare from './components/DocumentCompare';
import ExcelCompare from './components/ExcelCompare';
import FolderCompare from './components/FolderCompare';
import JsonCompare from './components/JsonCompare';
import SqlCompare from './components/SqlCompare';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return (localStorage.getItem('pc-activeTab') as TabType) || 'Text';
  });
  const [sidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('pc-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pc-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    localStorage.setItem('pc-activeTab', activeTab);
  }, [activeTab]);

  // Text diff settings
  const [options, setOptions] = useState<DiffOptions>(() => {
    const defaultOpts: DiffOptions = {
      realTime: false,
      hideUnchanged: false,
      disableWrap: false,
      layout: 'split',
      precision: 'word',
      syntax: 'auto',
      ignoreCase: false,
      ignoreWhitespace: false,
      trimWhitespace: false
    };
    const saved = localStorage.getItem('pc-options');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return { ...defaultOpts, ...parsed }; 
      } catch (e) {}
    }
    return defaultOpts;
  });

  useEffect(() => {
    localStorage.setItem('pc-options', JSON.stringify(options));
  }, [options]);

  const [originalValue, setOriginalValue] = useState('');
  const [modifiedValue, setModifiedValue] = useState('');

  // Simple splash screen delay
  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!hasStarted) {
    return (
      <div className="splash fade-in">
        <div className="splash-content">
          <div className="splash-icon">
            <Shield size={40} color="var(--accent)" />
          </div>
          <h2 className="splash-title">
            Private<span>Comparer</span>
          </h2>
          <div className="splash-sub">
            <Lock size={12} />
            Enterprise Privacy Framework
          </div>
          <div className="loading-bar">
            <div className="loading-bar-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleRestore = (orig: string, mod: string) => {
    setOriginalValue(orig);
    setModifiedValue(mod);
    setActiveTab('Text');
  };

  return (
    <div className="app-layout fade-in">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        theme={theme}
        onThemeToggle={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
      />
      
      <main className="main-content">
        {['Text', 'JSON', 'SQL', 'Documents', 'Excel'].includes(activeTab) && (
          <Sidebar 
            options={options} 
            setOptions={setOptions} 
            collapsed={sidebarCollapsed} 
            onRestore={handleRestore}
          />
        )}
        
        {activeTab === 'Text' ? (
          <DiffEditor 
            options={options}
            originalValue={originalValue}
            modifiedValue={modifiedValue}
            onOriginalChange={setOriginalValue}
            onModifiedChange={setModifiedValue}
          />
        ) : activeTab === 'JSON' ? (
           <JsonCompare options={options} />
        ) : activeTab === 'SQL' ? (
           <SqlCompare options={options} />
        ) : activeTab === 'Images' ? (
           <ImageCompare />
        ) : activeTab === 'Documents' ? (
           <DocumentCompare options={options} />
        ) : activeTab === 'Excel' ? (
           <ExcelCompare options={options} />
        ) : activeTab === 'Folders' ? (
           <FolderCompare />
        ) : (
          <div className="flex items-center justify-center full-height full-width" style={{ color: 'var(--text-muted)' }}>
             Not yet implemented.
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div>&copy; 2026 Checker Software Inc. (Private Comparer Build)</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="#">Contact</a>
          <a href="#">CLI</a>
          <a href="#">Enterprise</a>
          <a href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
