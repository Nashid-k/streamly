const fs = require('fs');
const file = '/home/edure/Desktop/Streamly/frontend/src/components/CustomVideoPlayer.jsx';
let code = fs.readFileSync(file, 'utf8');

const oldIframe = `  return (
    <iframe
      key={\`iframe-player-\${index}-\${iframeUrl}\`}
      src={iframeUrl}
      style={{
        width: '100%',
        height: 'min(calc(100vw * 9/16), calc(100vh - 120px))',
        border: 'none',
        background: '#000',
        borderRadius: '12px',
        boxShadow: '0 0 120px rgba(0,0,0,0.8)'
      }}
      allowFullScreen
      allow="autoplay; fullscreen"
    />
  );`;

const newIframe = `  return (
    <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 120px rgba(0,0,0,0.8)' }}>
      <iframe
        key={\`iframe-player-\${index}-\${iframeUrl}\`}
        src={iframeUrl}
        style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
        allowFullScreen
        allow="autoplay; fullscreen"
      />
    </div>
  );`;

code = code.replace(oldIframe, newIframe);
fs.writeFileSync(file, code);
