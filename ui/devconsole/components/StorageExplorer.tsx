import React, { useEffect, useState } from 'react';

interface StorageItem {
  key: string;
  value: string;
  type: 'localStorage' | 'sessionStorage' | 'cookies';
  size: string;
  timestamp: string;
}

const StorageExplorer = () => {
  const [storage, setStorage] = useState<StorageItem[]>([]);
  const [activeTab, setActiveTab] = useState<'localStorage' | 'sessionStorage' | 'cookies'>('localStorage');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    // Simulate storage data - in real implementation, these would come from IPC
    const mockStorage: StorageItem[] = [
      {
        key: 'user_preferences',
        value: '{"theme":"dark","language":"en"}',
        type: 'localStorage',
        size: '42 B',
        timestamp: new Date().toISOString()
      },
      {
        key: 'auth_token',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        type: 'localStorage',
        size: '156 B',
        timestamp: new Date(Date.now() - 1000).toISOString()
      },
      {
        key: 'session_id',
        value: 'sess_1234567890abcdef',
        type: 'sessionStorage',
        size: '24 B',
        timestamp: new Date(Date.now() - 2000).toISOString()
      },
      {
        key: 'temp_data',
        value: '{"cart":[],"preferences":{}}',
        type: 'sessionStorage',
        size: '32 B',
        timestamp: new Date(Date.now() - 3000).toISOString()
      },
      {
        key: 'session_cookie',
        value: 'session_value',
        type: 'cookies',
        size: '14 B',
        timestamp: new Date(Date.now() - 4000).toISOString()
      }
    ];
    setStorage(mockStorage);
  }, []);

  const filteredStorage = storage.filter(item => 
    item.type === activeTab && 
    (searchTerm === '' || 
     item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'localStorage': return '#569cd6';
      case 'sessionStorage': return '#4ec9b0';
      case 'cookies': return '#dcdcaa';
      default: return '#d4d4d4';
    }
  };

  const formatValue = (value: string) => {
    if (value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return value;
  };

  return (
    <div style={{ 
      background: '#252526', 
      borderRadius: '4px', 
      padding: '12px',
      border: '1px solid #3e3e42'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#cccccc' }}>💾 Storage Explorer</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('localStorage')}
            style={{
              background: activeTab === 'localStorage' ? '#094771' : '#1e1e1e',
              color: activeTab === 'localStorage' ? '#ffffff' : '#d4d4d4',
              border: '1px solid #3e3e42',
              borderRadius: '2px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Local Storage
          </button>
          <button
            onClick={() => setActiveTab('sessionStorage')}
            style={{
              background: activeTab === 'sessionStorage' ? '#094771' : '#1e1e1e',
              color: activeTab === 'sessionStorage' ? '#ffffff' : '#d4d4d4',
              border: '1px solid #3e3e42',
              borderRadius: '2px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Session Storage
          </button>
          <button
            onClick={() => setActiveTab('cookies')}
            style={{
              background: activeTab === 'cookies' ? '#094771' : '#1e1e1e',
              color: activeTab === 'cookies' ? '#ffffff' : '#d4d4d4',
              border: '1px solid #3e3e42',
              borderRadius: '2px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Cookies
          </button>
        </div>
        <input
          type="text"
          placeholder="Search storage..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            background: '#1e1e1e',
            color: '#d4d4d4',
            border: '1px solid #3e3e42',
            borderRadius: '2px',
            padding: '6px 8px',
            fontSize: '12px'
          }}
        />
      </div>
      <div style={{ 
        height: '180px', 
        overflow: 'auto',
        background: '#1e1e1e',
        borderRadius: '2px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 2fr 60px 80px',
          gap: '8px',
          padding: '8px',
          borderBottom: '1px solid #3e3e42',
          fontWeight: 'bold',
          fontSize: '11px',
          color: '#858585'
        }}>
          <div>Key</div>
          <div>Value</div>
          <div>Type</div>
          <div>Size</div>
        </div>
        {filteredStorage.map(item => (
          <div key={item.key} style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr 60px 80px',
            gap: '8px',
            padding: '8px',
            borderBottom: '1px solid #2d2d2d',
            fontSize: '11px',
            fontFamily: 'Consolas, monospace',
            alignItems: 'center'
          }}>
            <div style={{ color: '#d4d4d4', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.key}
            </div>
            <div style={{ color: '#858585', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatValue(item.value)}
            </div>
            <div style={{ color: getTypeColor(item.type) }}>
              {item.type}
            </div>
            <div style={{ color: '#858585' }}>
              {item.size}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorageExplorer;