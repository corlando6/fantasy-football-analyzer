export default function Header({ activeMainTab, setActiveMainTab }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>Fantasy Football '25</h1>
          <nav className="header-tabs">
            <button 
              className={`header-tab-btn ${activeMainTab === 'projections' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('projections')}
            >
              Projections
            </button>
            <button 
              className={`header-tab-btn ${activeMainTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('stats')}
            >
              2024 Stats
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}