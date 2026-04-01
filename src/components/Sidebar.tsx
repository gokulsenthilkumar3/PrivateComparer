import React from 'react';
import { Settings, History } from 'lucide-react';
import { type DiffPrecision } from '../lib/diffEngine';

export interface DiffOptions {
  realTime: boolean;
  hideUnchanged: boolean;
  disableWrap: boolean;
  layout: 'split' | 'unified';
  precision: DiffPrecision;
  syntax: string;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  trimWhitespace: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  originalValue: string;
  modifiedValue: string;
}

interface SidebarProps {
  options: DiffOptions;
  setOptions: (options: DiffOptions | ((prev: DiffOptions) => DiffOptions)) => void;
  collapsed: boolean;
  onRestore: (orig: string, mod: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ options, setOptions, collapsed, onRestore }) => {
  const [activeTab, setActiveTab] = React.useState<'tools'|'history'>('tools');
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);

  React.useEffect(() => {
    const loadHistory = () => {
      setHistory(JSON.parse(localStorage.getItem('diff-history') || '[]'));
    };
    loadHistory();
    window.addEventListener('history-updated', loadHistory);
    return () => window.removeEventListener('history-updated', loadHistory);
  }, []);

  if (collapsed) return null;

  const updateOption = <K extends keyof DiffOptions>(key: K, value: DiffOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-tabs">
          <button 
            className={`sidebar-header-tab ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            <Settings size={14} /> Tools
          </button>
          <button 
            className={`sidebar-header-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} /> History
          </button>
        </div>
      </div>

      <div style={{ display: activeTab === 'tools' ? 'block' : 'none' }}>
        <div className="sidebar-section">
        <label className="sidebar-row">
          <span>Real-time editor</span>
          <div 
            className={`toggle ${options.realTime ? 'active' : ''}`}
            onClick={() => updateOption('realTime', !options.realTime)}
          >
            <div className="toggle-knob" />
          </div>
        </label>
        <label className="sidebar-row">
          <span>Hide unchanged lines</span>
          <div 
            className={`toggle ${options.hideUnchanged ? 'active' : ''}`}
            onClick={() => updateOption('hideUnchanged', !options.hideUnchanged)}
          >
            <div className="toggle-knob" />
          </div>
        </label>
        <label className="sidebar-row">
          <span>Disable line wrap</span>
          <div 
            className={`toggle ${options.disableWrap ? 'active' : ''}`}
            onClick={() => updateOption('disableWrap', !options.disableWrap)}
          >
            <div className="toggle-knob" />
          </div>
        </label>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Layout</div>
        <div className="segmented">
          <button 
            className={`segmented-btn ${options.layout === 'split' ? 'active' : ''}`}
            onClick={() => updateOption('layout', 'split')}
          >
            Split
          </button>
          <button 
            className={`segmented-btn ${options.layout === 'unified' ? 'active' : ''}`}
            onClick={() => updateOption('layout', 'unified')}
          >
            Unified
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Diff precision</div>
        <div className="segmented">
          <button 
            className={`segmented-btn ${options.precision === 'word' ? 'active' : ''}`}
            onClick={() => updateOption('precision', 'word')}
          >
            Word
          </button>
          <button 
            className={`segmented-btn ${options.precision === 'character' ? 'active' : ''}`}
            onClick={() => updateOption('precision', 'character')}
          >
            Character
          </button>
        </div>
      </div>

      <div className="sidebar-section" style={{ borderBottom: 'none' }}>
        <div className="sidebar-section-title">Text transformations</div>
        
        <label className="sidebar-row">
          <span>Ignore case</span>
          <div 
            className={`toggle ${options.ignoreCase ? 'active' : ''}`}
            onClick={() => updateOption('ignoreCase', !options.ignoreCase)}
          >
            <div className="toggle-knob" />
          </div>
        </label>
        
        <label className="sidebar-row">
          <span>Ignore whitespace</span>
          <div 
            className={`toggle ${options.ignoreWhitespace ? 'active' : ''}`}
            onClick={() => updateOption('ignoreWhitespace', !options.ignoreWhitespace)}
          >
            <div className="toggle-knob" />
          </div>
        </label>

        <label className="sidebar-row">
          <span>Trim whitespace</span>
          <div 
            className={`toggle ${options.trimWhitespace ? 'active' : ''}`}
            onClick={() => updateOption('trimWhitespace', !options.trimWhitespace)}
          >
            <div className="toggle-knob" />
          </div>
        </label>
      </div>
      </div>
      
      {activeTab === 'history' && (
        <div className="history-tab" style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
          {history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map(item => (
                <div 
                  key={item.id} 
                  style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.375rem', cursor: 'pointer', border: '1px solid var(--border)' }}
                  onClick={() => onRestore(item.originalValue, item.modifiedValue)}
                  className="hover:border-accent hover:bg-accent-dim transition-all"
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Saved Diff</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(item.timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.originalValue}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
              No history found.<br/><br/>Click the 'Save' button in your Diff output to track changes.
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
