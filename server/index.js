const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });

let rooms = {}; // { roomName: { peers: Map<id, socket>, users: Map<id, name> } }

wss.on('connection', (socket) => {
  socket.id = generateId();
  socket.room = null;
  socket.userName = null;

  socket.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'join') {
      const { roomName, userName } = data;
      socket.userName = userName;
      socket.room = roomName;

      if (!rooms[roomName]) {
        rooms[roomName] = {
          peers: new Map(),
          users: new Map()
        };
      }

      rooms[roomName].peers.set(socket.id, socket);
      rooms[roomName].users.set(socket.id, userName);

      broadcast(roomName, {
        type: 'user_joined',
        id: socket.id,
        user: userName,
        users: Array.from(rooms[roomName].users.entries()).map(([id, name]) => ({ id, name }))
      });
    }

    if (data.type === 'signal') {
      const { target, signal } = data;
      const room = rooms[socket.room];
      if (room && room.peers.has(target)) {
        room.peers.get(target).send(JSON.stringify({
          type: 'signal',
          from: socket.id,
          signal
        }));
      }
    }

    if (data.type === 'disconnect') {
      handleLeave(socket);
    }
  });

  socket.on('close', () => {
    handleLeave(socket);
  });
});

function handleLeave(socket) {
  const roomName = socket.room;
  if (!roomName || !rooms[roomName]) return;

  rooms[roomName].peers.delete(socket.id);
  rooms[roomName].users.delete(socket.id);

  if (rooms[roomName].peers.size === 0) {
    delete rooms[roomName];
  } else {
    broadcast(roomName, {
      type: 'user_left',
      id: socket.id,
      users: Array.from(rooms[roomName].users.entries()).map(([id, name]) => ({ id, name }))
    });
  }
}

function broadcast(roomName, message) {
  if (!rooms[roomName]) return;
  rooms[roomName].peers.forEach((peer) => {
    peer.send(JSON.stringify(message));
  });
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

console.log(`WebSocket сервер запущен на порту ${PORT}`);
