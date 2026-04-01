import { ShieldCheck, Lock, Monitor, Sun, Moon } from 'lucide-react';

export type TabType = 'Text' | 'JSON' | 'SQL' | 'Images' | 'Documents' | 'Excel' | 'Folders';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, theme, onThemeToggle }) => {
  const tabs: { id: TabType; label: string; icon?: React.ReactNode; disabled?: boolean }[] = [
    { id: 'Text', label: 'Text' },
    { id: 'JSON', label: 'JSON' },
    { id: 'SQL', label: 'SQL' },
    { id: 'Images', label: 'Images' },
    { id: 'Documents', label: 'Documents' },
    { id: 'Excel', label: 'Excel' },
    { id: 'Folders', label: 'Folders' },
  ];

  return (
    <header className="navbar fade-in">
      <div className="navbar-left">
        <div className="navbar-brand" onClick={() => window.location.reload()}>
          <div className="navbar-brand-icon">
            <ShieldCheck size={18} color="white" />
          </div>
          <div className="navbar-brand-text">
            Private<span>Comparer</span>
          </div>
        </div>

        <nav className="navbar-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`navbar-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                if (!tab.disabled) onTabChange(tab.id);
                else alert(`\${tab.label} comparison is an upcoming premium feature.`);
              }}
              title={tab.disabled ? 'Coming soon' : ''}
              style={{ opacity: tab.disabled ? 0.6 : 1 }}
            >
              {tab.label}
            </div>
          ))}
        </nav>
      </div>

      <div className="navbar-right">
        <button className="navbar-tab" onClick={onThemeToggle} title="Toggle dark/light mode" style={{ padding: '0.4rem', borderRadius: '50%' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        
        <div className="navbar-badge" title="No network calls are made.">
          <Lock size={10} strokeWidth={3} />
          Local-Only Mode
        </div>
        
        <a 
          href="#" 
          className="navbar-tab"
          onClick={(e) => { e.preventDefault(); alert('Desktop App feature coming soon! It will allow offline folder comparisons.'); }}
        >
          <Monitor size={15} />
          <span>Desktop</span>
        </a>
      </div>
    </header>
  );
};

export default Header;
