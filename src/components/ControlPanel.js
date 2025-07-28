export default function ControlPanel({
  activeMainTab,
  leagueSettings,
  setLeagueSettings,
  scoringSettings,
  setScoringSettings,
  statsLeagueSettings,
  setStatsLeagueSettings,
  statsScoringSettings,
  setStatsScoringSettings,
  data,
  statsData,
  calculateProjections,
  calculateStats
}) {
  const currentLeagueSettings = activeMainTab === 'projections' ? leagueSettings : statsLeagueSettings;
  const setCurrentLeagueSettings = activeMainTab === 'projections' ? setLeagueSettings : setStatsLeagueSettings;
  const currentScoringSettings = activeMainTab === 'projections' ? scoringSettings : statsScoringSettings;
  const setCurrentScoringSettings = activeMainTab === 'projections' ? setScoringSettings : setStatsScoringSettings;
  const currentData = activeMainTab === 'projections' ? data : statsData;
  const calculateFunction = activeMainTab === 'projections' ? calculateProjections : calculateStats;

  return (
    <div className="control-panel">
      <div className="control-panel-content">
        <div className="settings-grid">
          <div className="settings-section">
            <h3>League Settings</h3>
            <div className="form-row">
              <div>
                <label>Teams</label>
                <input 
                  type="number" 
                  value={currentLeagueSettings.teams}
                  onChange={(e) => setCurrentLeagueSettings({...currentLeagueSettings, teams: +e.target.value})}
                />
              </div>
              <div>
                <label>QB</label>
                <input 
                  type="number" 
                  value={currentLeagueSettings.qb}
                  onChange={(e) => setCurrentLeagueSettings({...currentLeagueSettings, qb: +e.target.value})}
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>RB</label>
                <input 
                  type="number" 
                  value={currentLeagueSettings.rb}
                  onChange={(e) => setCurrentLeagueSettings({...currentLeagueSettings, rb: +e.target.value})}
                />
              </div>
              <div>
                <label>WR</label>
                <input 
                  type="number" 
                  value={currentLeagueSettings.wr}
                  onChange={(e) => setCurrentLeagueSettings({...currentLeagueSettings, wr: +e.target.value})}
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>TE</label>
                <input 
                  type="number" 
                  value={currentLeagueSettings.te}
                  onChange={(e) => setCurrentLeagueSettings({...currentLeagueSettings, te: +e.target.value})}
                />
              </div>
              <div>
                <label>FLEX</label>
                <input 
                  type="number" 
                  value={currentLeagueSettings.flex}
                  onChange={(e) => setCurrentLeagueSettings({...currentLeagueSettings, flex: +e.target.value})}
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
                  value={currentScoringSettings.ruYDS}
                  onChange={(e) => setCurrentScoringSettings({...currentScoringSettings, ruYDS: +e.target.value})}
                />
              </div>
              <div>
                <label>Rush TDs</label>
                <input 
                  type="number" 
                  value={currentScoringSettings.ruTDS}
                  onChange={(e) => setCurrentScoringSettings({...currentScoringSettings, ruTDS: +e.target.value})}
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Rec Yds</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={currentScoringSettings.reYDS}
                  onChange={(e) => setCurrentScoringSettings({...currentScoringSettings, reYDS: +e.target.value})}
                />
              </div>
              <div>
                <label>Rec TDs</label>
                <input 
                  type="number" 
                  value={currentScoringSettings.reTDS}
                  onChange={(e) => setCurrentScoringSettings({...currentScoringSettings, reTDS: +e.target.value})}
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Receptions</label>
                <input 
                  type="number" 
                  value={currentScoringSettings.reREC}
                  onChange={(e) => setCurrentScoringSettings({...currentScoringSettings, reREC: +e.target.value})}
                />
              </div>
              <div>
                <label>Pass Yds</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={currentScoringSettings.paYDS}
                  onChange={(e) => setCurrentScoringSettings({...currentScoringSettings, paYDS: +e.target.value})}
                />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Pass TDs</label>
                <input 
                  type="number" 
                  value={currentScoringSettings.paTDS}
                  onChange={(e) => setCurrentScoringSettings({...currentScoringSettings, paTDS: +e.target.value})}
                />
              </div>
              <div>
                <label>INTs</label>
                <input 
                  type="number" 
                  value={currentScoringSettings.INTS}
                  onChange={(e) => setCurrentScoringSettings({...currentScoringSettings, INTS: +e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          className="calculate-btn" 
          onClick={calculateFunction}
          disabled={!currentData}
        >
          {activeMainTab === 'projections' ? 'Build Projections' : 'Calculate 2024 Stats'}
        </button>
      </div>
    </div>
  );
}