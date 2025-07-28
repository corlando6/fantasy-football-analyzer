import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import DataTable from './components/DataTable';
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

  // Get current data for table
  const getCurrentTableData = () => {
    if (activeMainTab === 'projections') {
      return {
        data: results,
        activeTab,
        setActiveTab,
        filter: currentFilter,
        setFilter: setCurrentFilter,
        replacementLevels: results?.replacementLevels,
        type: 'projections'
      };
    } else if (activeMainTab === 'stats') {
      return {
        data: statsResults,
        activeTab: activeStatsTab,
        setActiveTab: setActiveStatsTab,
        filter: currentFilter,
        setFilter: setCurrentFilter,
        statsView: currentStatsView,
        setStatsView: setCurrentStatsView,
        type: 'stats'
      };
    }
    return null;
  };

  return (
    <div className="app">
      <Header 
        activeMainTab={activeMainTab}
        setActiveMainTab={setActiveMainTab}
      />
      
      <ControlPanel
        activeMainTab={activeMainTab}
        leagueSettings={leagueSettings}
        setLeagueSettings={setLeagueSettings}
        scoringSettings={scoringSettings}
        setScoringSettings={setScoringSettings}
        statsLeagueSettings={statsLeagueSettings}
        setStatsLeagueSettings={setStatsLeagueSettings}
        statsScoringSettings={statsScoringSettings}
        setStatsScoringSettings={setStatsScoringSettings}
        data={data}
        statsData={statsData}
        calculateProjections={calculateProjections}
        calculateStats={calculateStats}
      />

      <DataTable
        {...getCurrentTableData()}
        exportCSV={exportCSV}
      />
    </div>
  );
}