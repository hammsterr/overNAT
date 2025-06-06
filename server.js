const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let localClientSocket = null;

// Для аптайм проверки
app.get('/ping', (req, res) => {
  res.send('I am alive!');
});

// Основной эндпоинт — проксирует запрос на клиент
app.get('/', (req, res) => {
  if (!localClientSocket) {
    return res.status(503).send('Local PC is offline.');
  }

  // Отправляем запрос клиенту
  localClientSocket.emit('request', req.headers, (response) => {
    res.send(response);
  });
});

// Подключение клиента через Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Клиент подключён:', socket.id);
  localClientSocket = socket;

  socket.on('disconnect', () => {
    console.log('🚫 Клиент отключён:', socket.id);
    localClientSocket = null;
  });

  socket.on('response', (data) => {
    console.log('⬅️ Получен ответ от клиента:', data.slice(0, 50) + '...');
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🟢 Сервер запущен на порту ${PORT}`);
});
