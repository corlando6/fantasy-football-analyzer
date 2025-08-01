import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

export default function App() {
  const [data, setData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [results, setResults] = useState(null);
  const [statsResults, setStatsResults] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [activeStatsTab, setActiveStatsTab] = useState('ALL');
  const [currentFilter, setCurrentFilter] = useState('');
  const [currentStatsView, setCurrentStatsView] = useState('basic');
  const [activeMainTab, setActiveMainTab] = useState('projections');
  
  // Form state
  const [leagueSettings, setLeagueSettings] = useState({
    teams: 12, qb: 1, rb: 2, wr: 3, te: 1, flex: 1
  });
  
  const [scoringSettings, setScoringSettings] = useState({
    ruYDS: 0.1, ruTDS: 6, reYDS: 0.1, reTDS: 6, reREC: 1, 
    paYDS: 0.04, paTDS: 4, INTS: -2
  });
  
  const [statsLeagueSettings, setStatsLeagueSettings] = useState({
    teams: 12, qb: 1, rb: 2, wr: 3, te: 1, flex: 1
  });
  
  const [statsScoringSettings, setStatsScoringSettings] = useState({
    ruYDS: 0.1, ruTDS: 6, reYDS: 0.1, reTDS: 6, reREC: 1, 
    paYDS: 0.04, paTDS: 4, INTS: -2
  });

  // Auto-load projections CSV on component mount
  useEffect(() => {
    const fetchProjections = async () => {
      try {
        const res = await fetch('/fantasy-football-analyzer/data/final_proj.csv');
        const text = await res.text();
        const parsed = parseCSV(text);
        setData(parsed);
      } catch (error) {
        console.error('Error loading projections CSV:', error);
      }
    };
    fetchProjections();
  }, []);

  // Auto-load stats CSV on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/fantasy-football-analyzer/data/prev_stats.csv');
        const text = await res.text();
        const parsed = parseStatsCSV(text);
        setStatsData(parsed);
      } catch (error) {
        console.error('Error loading stats CSV:', error);
      }
    };
    fetchStats();
  }, []);

  const parseCSV = (text) => {
    const result = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', '\t', '|', ';']
    });
    
    return result.data.map(row => ({
      Player: row.Player || '',
      Team: row.Team || '',
      Position: row.Position || '',
      ruATT: +row.ruATT || 0, ruYDS: +row.ruYDS || 0, ruTDS: +row.ruTDS || 0,
      reREC: +row.reREC || 0, reYDS: +row.reYDS || 0, reTDS: +row.reTDS || 0,
      paATT: +row.paATT || 0, paCMP: +row.paCMP || 0, paYDS: +row.paYDS || 0,
      paTDS: +row.paTDS || 0, INTS: +row.INTS || 0
    })).filter(p => p.Player && p.Position);
  };

  const parseStatsCSV = (text) => {
    const result = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', '\t', '|', ';']
    });
    
    return result.data.map(row => ({
      Player: row.merge_name || row.player_name || row.Player || '',
      Team: row.team || row.Team || '',
      Position: row.position || row.Position || '',
      Games: +row.games || 0,
      ruATT: +row.carries || 0,
      ruYDS: +row.rushing_yards || 0,
      ruTDS: +row.rushing_tds || 0,
      reREC: +row.receptions || 0,
      reYDS: +row.receiving_yards || 0,
      reTDS: +row.receiving_tds || 0,
      paATT: +row.attempts || 0,
      paCMP: +row.completions || 0,
      paYDS: +row.passing_yards || 0,
      paTDS: +row.passing_tds || 0,
      INTS: +row.interceptions || 0,
      targets: +row.targets || 0,
      receivingAirYards: +row.receiving_air_yards || 0,
      receivingYAC: +row.receiving_yards_after_catch || 0,
      receivingEPA: +row.receiving_epa || 0
    })).filter(p => p.Player && p.Position);
  };

  const calcPoints = (players, scoring) => {
    return players.map(p => ({
      ...p,
      FPTS: p.ruYDS * scoring.ruYDS + p.ruTDS * scoring.ruTDS + 
            p.reYDS * scoring.reYDS + p.reTDS * scoring.reTDS + p.reREC * scoring.reREC +
            p.paYDS * scoring.paYDS + p.paTDS * scoring.paTDS + p.INTS * scoring.INTS
    }));
  };

  const calculateProjections = () => {
    if (!data) return;
    
    const processed = calcPoints(data, scoringSettings);
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const grouped = {};
    const replacementLevels = {};

    positions.forEach(pos => {
      const players = processed.filter(p => p.Position === pos).sort((a,b) => b.FPTS - a.FPTS);
      const startingSpots = leagueSettings[pos.toLowerCase()] * leagueSettings.teams;
      const flexEligible = ['RB', 'WR', 'TE'].includes(pos);
      const totalSpots = startingSpots + (flexEligible ? Math.floor(leagueSettings.flex * leagueSettings.teams / 3) : 0);
      
      const replacementLevel = players[totalSpots - 1]?.FPTS || 0;
      replacementLevels[pos] = replacementLevel;
      
      grouped[pos] = players.map(p => ({
        ...p,
        VORP: p.FPTS - replacementLevel
      })).sort((a,b) => b.VORP - a.VORP);
    });

    grouped.ALL = Object.values(grouped).flat().sort((a,b) => b.VORP - a.VORP);
    grouped.replacementLevels = replacementLevels;
    setResults(grouped);
  };

  const calculateStats = () => {
    if (!statsData) return;
    const processed = calcPoints(statsData, statsScoringSettings);
    const grouped = {
      QB: processed.filter(p => p.Position === 'QB').sort((a,b) => b.FPTS - a.FPTS),
      RB: processed.filter(p => p.Position === 'RB').sort((a,b) => b.FPTS - a.FPTS),
      WR: processed.filter(p => p.Position === 'WR').sort((a,b) => b.FPTS - a.FPTS),
      TE: processed.filter(p => p.Position === 'TE').sort((a,b) => b.FPTS - a.FPTS),
      ALL: processed.sort((a,b) => b.FPTS - a.FPTS)
    };
    
    setStatsResults(grouped);
  };

  const exportCSV = (type) => {
    let dataToExport, filename;
    
    if (type === 'projections' && results) {
      dataToExport = results.ALL;
      filename = 'fantasy_projections.csv';
    } else if (type === 'stats' && statsResults) {
      dataToExport = statsResults.ALL;
      filename = currentStatsView === 'basic' ? 'fantasy_2024_stats.csv' : 'fantasy_2024_advanced_stats.csv';
    } else {
      return;
    }

    let headers = ['Player', 'Team', 'Position', 'FPTS'];
    if (type === 'projections') headers.push('VORP');
    if (type === 'stats') headers.push('Games');
    headers.push('ruATT', 'ruYDS', 'ruTDS', 'reREC', 'reYDS', 'reTDS', 'paATT', 'paCMP', 'paYDS', 'paTDS', 'INTS');
    
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(p => {
        const row = [`"${p.Player}"`, `"${p.Team}"`, p.Position, p.FPTS.toFixed(1)];
        if (type === 'projections') row.push(p.VORP.toFixed(1));
        if (type === 'stats') row.push(p.Games || 0);
        row.push(p.ruATT, p.ruYDS, p.ruTDS, p.reREC, p.reYDS, p.reTDS, p.paATT, p.paCMP, p.paYDS, p.paTDS, p.INTS);
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = (dataSource, tabType) => {
    const currentTabData = tabType === 'stats' ? activeStatsTab : activeTab;
    const players = dataSource?.[currentTabData] || [];
    const filtered = players.filter(p => 
      !currentFilter || p.Player.toLowerCase().includes(currentFilter.toLowerCase())
    );

    return (
      <div className="table-section">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Pos</th>
                <th className="numeric">FPTS</th>
                {tabType === 'projections' && <th className="numeric">VORP</th>}
                {tabType === 'stats' && currentStatsView === 'basic' && <th className="numeric">Games</th>}
                {tabType === 'stats' && currentStatsView === 'advanced' && (
                  <>
                    <th className="numeric">Targets</th>
                    <th className="numeric">ReAirYds</th>
                    <th className="numeric">ReYAC</th>
                    <th className="numeric">ReEPA</th>
                  </>
                )}
                <th className="numeric">RuAtt</th>
                <th className="numeric">RuYds</th>
                <th className="numeric">RuTD</th>
                <th className="numeric">Rec</th>
                <th className="numeric">ReYds</th>
                <th className="numeric">ReTD</th>
                <th className="numeric">PaAtt</th>
                <th className="numeric">PaCmp</th>
                <th className="numeric">PaYds</th>
                <th className="numeric">PaTD</th>
                <th className="numeric">INT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i}>
                  <td>{p.Player}</td>
                  <td>{p.Team}</td>
                  <td><span className="pos-badge">{p.Position}</span></td>
                  <td className="numeric">{p.FPTS.toFixed(1)}</td>
                  {tabType === 'projections' && (
                    <td className={`numeric ${p.VORP > 0 ? 'vorp-pos' : 'vorp-neg'}`}>
                      {p.VORP.toFixed(1)}
                    </td>
                  )}
                  {tabType === 'stats' && currentStatsView === 'basic' && (
                    <td className="numeric">{p.Games || 0}</td>
                  )}
                  {tabType === 'stats' && currentStatsView === 'advanced' && (
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
    );
  };

  return (
    <div className="container">
      <div className="header">
        <div className="header-left">
          <h1>Fantasy Football '25</h1>
          <div className="header-tabs">
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
          </div>
        </div>
      </div>

      <div className="content">
        {/* Projections Tab */}
        {activeMainTab === 'projections' && (
          <div className="tab-content active">
            <div className="settings-grid">
              <div className="settings-section">
                <h3>League Settings</h3>
                <div className="form-row">
                  <div>
                    <label>Teams</label>
                    <input 
                      type="number" 
                      value={leagueSettings.teams}
                      onChange={(e) => setLeagueSettings({...leagueSettings, teams: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>QB</label>
                    <input 
                      type="number" 
                      value={leagueSettings.qb}
                      onChange={(e) => setLeagueSettings({...leagueSettings, qb: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>RB</label>
                    <input 
                      type="number" 
                      value={leagueSettings.rb}
                      onChange={(e) => setLeagueSettings({...leagueSettings, rb: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>WR</label>
                    <input 
                      type="number" 
                      value={leagueSettings.wr}
                      onChange={(e) => setLeagueSettings({...leagueSettings, wr: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>TE</label>
                    <input 
                      type="number" 
                      value={leagueSettings.te}
                      onChange={(e) => setLeagueSettings({...leagueSettings, te: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>FLEX</label>
                    <input 
                      type="number" 
                      value={leagueSettings.flex}
                      onChange={(e) => setLeagueSettings({...leagueSettings, flex: +e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Scoring Settings</h3>
                <div className="form-row">
                  <div>
                    <label>Rush Yds</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={scoringSettings.ruYDS}
                      onChange={(e) => setScoringSettings({...scoringSettings, ruYDS: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Rush TDs</label>
                    <input 
                      type="number" 
                      value={scoringSettings.ruTDS}
                      onChange={(e) => setScoringSettings({...scoringSettings, ruTDS: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>Rec Yds</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={scoringSettings.reYDS}
                      onChange={(e) => setScoringSettings({...scoringSettings, reYDS: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Rec TDs</label>
                    <input 
                      type="number" 
                      value={scoringSettings.reTDS}
                      onChange={(e) => setScoringSettings({...scoringSettings, reTDS: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>Receptions</label>
                    <input 
                      type="number" 
                      value={scoringSettings.reREC}
                      onChange={(e) => setScoringSettings({...scoringSettings, reREC: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Pass Yds</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={scoringSettings.paYDS}
                      onChange={(e) => setScoringSettings({...scoringSettings, paYDS: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>Pass TDs</label>
                    <input 
                      type="number" 
                      value={scoringSettings.paTDS}
                      onChange={(e) => setScoringSettings({...scoringSettings, paTDS: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>INTs</label>
                    <input 
                      type="number" 
                      value={scoringSettings.INTS}
                      onChange={(e) => setScoringSettings({...scoringSettings, INTS: +e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="calculate-section">
              <button 
                className="btn calculate-btn" 
                onClick={calculateProjections}
                disabled={!data}
              >
                Build Projections
              </button>
            </div>

            {results && (
              <div className="results">
                <div className="controls">
                  <h2>2025 Projections</h2>
                  <div className="filter-controls">
                    <input 
                      type="text" 
                      placeholder="Filter players..." 
                      className="filter-input"
                      value={currentFilter}
                      onChange={(e) => setCurrentFilter(e.target.value)}
                    />
                    <button 
                      className="clear-btn"
                      onClick={() => setCurrentFilter('')}
                    >
                      Clear
                    </button>
                    <button 
                      className="btn export-btn"
                      onClick={() => exportCSV('projections')}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {results.replacementLevels && (
                  <div className="replacement-section">
                    <h4>Replacement Levels</h4>
                    <div className="replacement-grid">
                      {Object.entries(results.replacementLevels).map(([pos, val]) => (
                        <div key={pos} className="replacement-item">
                          <div className="label">{pos}</div>
                          <div className="value">{val.toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

                {renderTable(results, 'projections')}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeMainTab === 'stats' && (
          <div className="tab-content active">
            <div className="settings-grid">
              <div className="settings-section">
                <h3>League Settings</h3>
                <div className="form-row">
                  <div>
                    <label>Teams</label>
                    <input 
                      type="number" 
                      value={statsLeagueSettings.teams}
                      onChange={(e) => setStatsLeagueSettings({...statsLeagueSettings, teams: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>QB</label>
                    <input 
                      type="number" 
                      value={statsLeagueSettings.qb}
                      onChange={(e) => setStatsLeagueSettings({...statsLeagueSettings, qb: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>RB</label>
                    <input 
                      type="number" 
                      value={statsLeagueSettings.rb}
                      onChange={(e) => setStatsLeagueSettings({...statsLeagueSettings, rb: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>WR</label>
                    <input 
                      type="number" 
                      value={statsLeagueSettings.wr}
                      onChange={(e) => setStatsLeagueSettings({...statsLeagueSettings, wr: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>TE</label>
                    <input 
                      type="number" 
                      value={statsLeagueSettings.te}
                      onChange={(e) => setStatsLeagueSettings({...statsLeagueSettings, te: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>FLEX</label>
                    <input 
                      type="number" 
                      value={statsLeagueSettings.flex}
                      onChange={(e) => setStatsLeagueSettings({...statsLeagueSettings, flex: +e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Scoring Settings</h3>
                <div className="form-row">
                  <div>
                    <label>Rush Yds</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={statsScoringSettings.ruYDS}
                      onChange={(e) => setStatsScoringSettings({...statsScoringSettings, ruYDS: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Rush TDs</label>
                    <input 
                      type="number" 
                      value={statsScoringSettings.ruTDS}
                      onChange={(e) => setStatsScoringSettings({...statsScoringSettings, ruTDS: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>Rec Yds</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={statsScoringSettings.reYDS}
                      onChange={(e) => setStatsScoringSettings({...statsScoringSettings, reYDS: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Rec TDs</label>
                    <input 
                      type="number" 
                      value={statsScoringSettings.reTDS}
                      onChange={(e) => setStatsScoringSettings({...statsScoringSettings, reTDS: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>Receptions</label>
                    <input 
                      type="number" 
                      value={statsScoringSettings.reREC}
                      onChange={(e) => setStatsScoringSettings({...statsScoringSettings, reREC: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>Pass Yds</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={statsScoringSettings.paYDS}
                      onChange={(e) => setStatsScoringSettings({...statsScoringSettings, paYDS: +e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>Pass TDs</label>
                    <input 
                      type="number" 
                      value={statsScoringSettings.paTDS}
                      onChange={(e) => setStatsScoringSettings({...statsScoringSettings, paTDS: +e.target.value})}
                    />
                  </div>
                  <div>
                    <label>INTs</label>
                    <input 
                      type="number" 
                      value={statsScoringSettings.INTS}
                      onChange={(e) => setStatsScoringSettings({...statsScoringSettings, INTS: +e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="calculate-section">
              <button 
                className="btn calculate-btn" 
                onClick={calculateStats}
                disabled={!statsData}
              >
                Calculate 2024 Stats
              </button>
            </div>

            {statsResults && (
              <div className="results">
                <div className="controls">
                  <h2>2024 Results</h2>
                  <div className="filter-controls">
                    <input 
                      type="text" 
                      placeholder="Filter players..." 
                      className="filter-input"
                      value={currentFilter}
                      onChange={(e) => setCurrentFilter(e.target.value)}
                    />
                    <button 
                      className="clear-btn"
                      onClick={() => setCurrentFilter('')}
                    >
                      Clear
                    </button>
                    <button 
                      className="btn export-btn"
                      onClick={() => exportCSV('stats')}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="stats-view-tabs">
                  <button 
                    className={`stats-view-tab ${currentStatsView === 'basic' ? 'active' : ''}`}
                    onClick={() => setCurrentStatsView('basic')}
                  >
                    Basic Stats
                  </button>
                  <button 
                    className={`stats-view-tab ${currentStatsView === 'advanced' ? 'active' : ''}`}
                    onClick={() => setCurrentStatsView('advanced')}
                  >
                    Advanced Stats
                  </button>
                </div>

                <div className="pos-tabs">
                  <button 
                    className={`pos-tab ${activeStatsTab === 'ALL' ? 'active' : ''}`}
                    onClick={() => setActiveStatsTab('ALL')}
                  >
                    ALL
                  </button>
                  {['QB', 'RB', 'WR', 'TE'].map(pos => (
                    <button 
                      key={pos}
                      className={`pos-tab ${activeStatsTab === pos ? 'active' : ''}`}
                      onClick={() => setActiveStatsTab(pos)}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                {renderTable(statsResults, 'stats')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}