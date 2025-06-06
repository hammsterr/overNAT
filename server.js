const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let localClientSocket = null;

// Проверка жизни
app.get('/ping', (req, res) => {
  res.send('I am alive!');
});

// Основной эндпоинт
app.get('/', (req, res) => {
  if (!localClientSocket) {
    return res.status(503).send('Local PC is offline.');
  }

  // Отправляем запрос в клиент
  localClientSocket.emit('request', req.headers, (response) => {
    res.send(response);
  });
});

io.on('connection', (socket) => {
  console.log('Client connected');
  localClientSocket = socket;

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    localClientSocket = null;
  });

  socket.on('response', (data) => {
    console.log('Response from client:', data.slice(0, 50) + '...');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Render server running on port ${PORT}`);
});
