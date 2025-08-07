import React, { useEffect, useState } from 'react';

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  type: string;
  size: string;
  time: string;
  timestamp: string;
}

const NetworkPanel = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Simulate network requests - in real implementation, these would come from IPC
    const mockRequests: NetworkRequest[] = [
      {
        id: '1',
        url: 'https://api.example.com/data',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        type: 'xhr',
        size: '1.2 KB',
        time: '245ms',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        url: 'https://cdn.example.com/script.js',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        type: 'script',
        size: '45.8 KB',
        time: '89ms',
        timestamp: new Date(Date.now() - 1000).toISOString()
      },
      {
        id: '3',
        url: 'https://fonts.example.com/font.woff2',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        type: 'font',
        size: '12.4 KB',
        time: '156ms',
        timestamp: new Date(Date.now() - 2000).toISOString()
      },
      {
        id: '4',
        url: 'https://api.example.com/failed',
        method: 'POST',
        status: 404,
        statusText: 'Not Found',
        type: 'xhr',
        size: '0 B',
        time: '1.2s',
        timestamp: new Date(Date.now() - 3000).toISOString()
      }
    ];
    setRequests(mockRequests);
  }, []);

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.type === filter);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#4ec9b0';
    if (status >= 300 && status < 400) return '#dcdcaa';
    if (status >= 400 && status < 500) return '#f48771';
    if (status >= 500) return '#f48771';
    return '#d4d4d4';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#569cd6';
      case 'POST': return '#4ec9b0';
      case 'PUT': return '#dcdcaa';
      case 'DELETE': return '#f48771';
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
        <h3 style={{ margin: 0, color: '#cccccc' }}>🌐 Network Requests</h3>
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
          <option value="all">All Types</option>
          <option value="xhr">XHR</option>
          <option value="script">Scripts</option>
          <option value="font">Fonts</option>
          <option value="image">Images</option>
        </select>
      </div>
      <div style={{ 
        height: '200px', 
        overflow: 'auto',
        background: '#1e1e1e',
        borderRadius: '2px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '60px 1fr 80px 60px 60px 60px',
          gap: '8px',
          padding: '8px',
          borderBottom: '1px solid #3e3e42',
          fontWeight: 'bold',
          fontSize: '11px',
          color: '#858585'
        }}>
          <div>Method</div>
          <div>URL</div>
          <div>Status</div>
          <div>Type</div>
          <div>Size</div>
          <div>Time</div>
        </div>
        {filteredRequests.map(req => (
          <div key={req.id} style={{ 
            display: 'grid', 
            gridTemplateColumns: '60px 1fr 80px 60px 60px 60px',
            gap: '8px',
            padding: '8px',
            borderBottom: '1px solid #2d2d2d',
            fontSize: '11px',
            fontFamily: 'Consolas, monospace',
            alignItems: 'center'
          }}>
            <div style={{ color: getMethodColor(req.method), fontWeight: 'bold' }}>
              {req.method}
            </div>
            <div style={{ color: '#d4d4d4', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {req.url}
            </div>
            <div style={{ color: getStatusColor(req.status) }}>
              {req.status}
            </div>
            <div style={{ color: '#858585' }}>
              {req.type}
            </div>
            <div style={{ color: '#858585' }}>
              {req.size}
            </div>
            <div style={{ color: '#858585' }}>
              {req.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkPanel;