import React, { useEffect, useState } from 'react';

const DOMViewer = () => {
  const [domTree, setDomTree] = useState('');

  useEffect(() => {
    // You can replace this with IPC call later
    setDomTree('<html>\n  <head>\n    <title>Sample Page</title>\n  </head>\n  <body>\n    <h1>Sample DOM Tree</h1>\n    <p>This is a sample DOM structure for demonstration.</p>\n    <div class="container">\n      <nav>\n        <ul>\n          <li><a href="#">Home</a></li>\n          <li><a href="#">About</a></li>\n        </ul>\n      </nav>\n      <main>\n        <section>\n          <h2>Welcome</h2>\n          <p>Content goes here...</p>\n        </section>\n      </main>\n    </div>\n  </body>\n</html>');
  }, []);

  return (
    <div style={{ 
      background: '#252526', 
      borderRadius: '4px', 
      padding: '12px',
      border: '1px solid #3e3e42'
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#cccccc' }}>🌳 DOM Viewer</h3>
      <div style={{ 
        height: '200px', 
        overflow: 'auto',
        background: '#1e1e1e',
        borderRadius: '2px',
        padding: '8px',
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        color: '#d4d4d4'
      }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{domTree}</pre>
      </div>
    </div>
  );
};

export default DOMViewer;