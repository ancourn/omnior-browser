import React from 'react';
import { createRoot } from 'react-dom/client';
import DOMViewer from './components/DOMViewer';
import LogsViewer from './components/LogsViewer';
import NetworkPanel from './components/NetworkPanel';
import StorageExplorer from './components/StorageExplorer';

const App = () => {
  return (
    <div style={{ padding: 12, height: '100vh', overflow: 'auto' }}>
      <h2 style={{ margin: '0 0 16px 0', color: '#569cd6' }}>🔧 Omnior DevConsole</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DOMViewer />
          <LogsViewer />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <NetworkPanel />
          <StorageExplorer />
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);