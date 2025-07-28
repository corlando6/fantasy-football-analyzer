export default function DataTable({
  data,
  activeTab,
  setActiveTab,
  filter,
  setFilter,
  replacementLevels,
  statsView,
  setStatsView,
  type,
  exportCSV
}) {
  if (!data) {
    return (
      <div className="data-table">
        <div className="no-data">
          <h3>No data available</h3>
          <p>Configure your settings and click the calculate button to see results.</p>
        </div>
      </div>
    );
  }

  const players = data[activeTab] || [];
  const filtered = players.filter(p => 
    !filter || p.Player.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="data-table">
      <div className="table-header">
        <div className="table-header-content">
          <div className="table-controls">
            <h2>
              {type === 'projections' ? '2025 Projections' : '2024 Results'}
            </h2>
            <div className="filter-controls">
              <input 
                type="text" 
                placeholder="Filter players..." 
                className="filter-input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <button 
                className="clear-btn"
                onClick={() => setFilter('')}
              >
                Clear
              </button>
              <button 
                className="export-btn"
                onClick={() => exportCSV(type)}
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Replacement Levels for Projections */}
          {type === 'projections' && replacementLevels && (
            <div className="replacement-section">
              <h4>Replacement Levels</h4>
              <div className="replacement-grid">
                {Object.entries(replacementLevels).map(([pos, val]) => (
                  <div key={pos} className="replacement-item">
                    <div className="label">{pos}</div>
                    <div className="value">{val.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats View Tabs */}
          {type === 'stats' && (
            <div className="stats-view-tabs">
              <button 
                className={`stats-view-tab ${statsView === 'basic' ? 'active' : ''}`}
                onClick={() => setStatsView('basic')}
              >
                Basic Stats
              </button>
              <button 
                className={`stats-view-tab ${statsView === 'advanced' ? 'active' : ''}`}
                onClick={() => setStatsView('advanced')}
              >
                Advanced Stats
              </button>
            </div>
          )}

          {/* Position Tabs */}
          <div className="pos-tabs">
            <button 
              className={`pos-tab ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              ALL
            </button>
            {['QB', 'RB', 'WR', 'TE'].map(pos => (
              <button 
                key={pos}
                className={`pos-tab ${activeTab === pos ? 'active' : ''}`}
                onClick={() => setActiveTab(pos)}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-body">
        <div className="table-body-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Pos</th>
                  <th className="numeric-header">FPTS</th>
                  {type === 'projections' && <th className="numeric-header">VORP</th>}
                  {type === 'stats' && statsView === 'basic' && <th className="numeric-header">Games</th>}
                  {type === 'stats' && statsView === 'advanced' && (
                    <>
                      <th className="numeric-header">Targets</th>
                      <th className="numeric-header">ReAirYds</th>
                      <th className="numeric-header">ReYAC</th>
                      <th className="numeric-header">ReEPA</th>
                    </>
                  )}
                  <th className="numeric-header">RuAtt</th>
                  <th className="numeric-header">RuYds</th>
                  <th className="numeric-header">RuTD</th>
                  <th className="numeric-header">Rec</th>
                  <th className="numeric-header">ReYds</th>
                  <th className="numeric-header">ReTD</th>
                  <th className="numeric-header">PaAtt</th>
                  <th className="numeric-header">PaCmp</th>
                  <th className="numeric-header">PaYds</th>
                  <th className="numeric-header">PaTD</th>
                  <th className="numeric-header">INT</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={i}>
                    <td>{p.Player}</td>
                    <td>{p.Team}</td>
                    <td><span className="pos-badge">{p.Position}</span></td>
                    <td className="numeric">{p.FPTS.toFixed(1)}</td>
                    {type === 'projections' && (
                      <td className={`numeric ${p.VORP > 0 ? 'vorp-pos' : 'vorp-neg'}`}>
                        {p.VORP.toFixed(1)}
                      </td>
                    )}
                    {type === 'stats' && statsView === 'basic' && (
                      <td className="numeric">{p.Games || 0}</td>
                    )}
                    {type === 'stats' && statsView === 'advanced' && (
                      <>
                        <td className="numeric">{p.targets || 0}</td>
                        <td className="numeric">{p.receivingAirYards || 0}</td>
                        <td className="numeric">{p.receivingYAC || 0}</td>
                        <td className="numeric">{p.receivingEPA?.toFixed(2) || 0}</td>
                      </>
                    )}
                    <td className="numeric">{p.ruATT}</td>
                    <td className="numeric">{p.ruYDS}</td>
                    <td className="numeric">{p.ruTDS}</td>
                    <td className="numeric">{p.reREC}</td>
                    <td className="numeric">{p.reYDS}</td>
                    <td className="numeric">{p.reTDS}</td>
                    <td className="numeric">{p.paATT}</td>
                    <td className="numeric">{p.paCMP}</td>
                    <td className="numeric">{p.paYDS}</td>
                    <td className="numeric">{p.paTDS}</td>
                    <td className="numeric">{p.INTS}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}