const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8010 });
const code2ws = new Map();

wss.on('connection', function connection(ws, request) {
  ws.sendData = (event, data) => {
    ws.send(JSON.stringify({ event, data }));
  };

  const code = Math.floor(Math.random() * (999999 - 100000)) + 100000;
  const ip = request.connection.remoteAddress;
  code2ws.set(code, ws);
  ws.on('message', function(message) {
    let parsedMsg = {};
    try {
      parsedMsg = JSON.parse(message);
    } catch (e) {
      ws.sendData('error', e);
    }
    const { event, data } = parsedMsg;
    const remote = +data.remote;
    switch (event) {
      case 'login':
        ws.sendData('login', { code });
        break;
      case 'control':
        if (code2ws.has(remote)) {
          ws.sendData('controll', { remote });
          const remoteWs = code2ws.get(remote);
          ws.sendRemote = remoteWs.sendData;
          remoteWs.sendRemote = ws.sendData;
          ws.sendRemote('controlled', { remote: code });
        } else {
          ws.sendData('error', 'user not found');
        }
        break;
      case 'forward':
        ws.sendRemote(event, data);
        break;
      default:
        ws.sendData('error', 'mesaage not handled');
        break;
    }
  });

  ws.on('close', () => {
    code2ws.delete(code);
    delete ws.sendRemote;
    clearTimeout(ws.closeTimeout);
  });

  ws.closeTimeout = setTimeout(() => {
    ws.terminate();
  }, 600000);
});
