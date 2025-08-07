import React, { useEffect, useState } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
}

const LogsViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Simulate log entries - in real implementation, these would come from IPC
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Application started successfully',
        source: 'app'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000).toISOString(),
        level: 'debug',
        message: 'Initializing DevConsole components',
        source: 'devconsole'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 2000).toISOString(),
        level: 'warn',
        message: 'Performance optimization recommended',
        source: 'performance'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 3000).toISOString(),
        level: 'error',
        message: 'Failed to load resource: net::ERR_CONNECTION_REFUSED',
        source: 'network'
      }
    ];
    setLogs(mockLogs);
  }, []);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return '#f48771';
      case 'warn': return '#f8c555';
      case 'info': return '#569cd6';
      case 'debug': return '#cccccc';
      default: return '#d4d4d4';
    }
  };

  return (
    <div style={{ 
      background: '#252526', 
      borderRadius: '4px', 
      padding: '12px',
      border: '1px solid #3e3e42'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ margin: 0, color: '#cccccc' }}>📋 Console Logs</h3>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            border: '1px solid #3e3e42',
            borderRadius: '2px',
            padding: '4px 8px'
          }}
        >
          <option value="all">All Levels</option>
          <option value="error">Errors</option>
          <option value="warn">Warnings</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </div>
      <div style={{ 
        height: '200px', 
        overflow: 'auto',
        background: '#1e1e1e',
        borderRadius: '2px',
        padding: '8px',
        fontFamily: 'Consolas, monospace',
        fontSize: '12px'
      }}>
        {filteredLogs.map(log => (
          <div key={log.id} style={{ marginBottom: '4px' }}>
            <span style={{ color: '#858585', marginRight: '8px' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span style={{ color: getLogColor(log.level), marginRight: '8px', fontWeight: 'bold' }}>
              [{log.level.toUpperCase()}]
            </span>
            <span style={{ color: '#569cd6', marginRight: '8px' }}>
              {log.source}:
            </span>
            <span style={{ color: '#d4d4d4' }}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogsViewer;