const express = require('express');
const http = require('http');
const WebSocket = require('websocket').server;
const router = require('./src/api/index.js');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { auth } = require('./src/lib/authMiddleware.js');

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocket({ httpServer: server });

// 환경변수 사용선언
dotenv.config();
app.use(express.json());

// API routing
app.use('/api', router);  

// WebSocket 연결 관리
const clients = {};  // 연결된 클라이언트를 저장할 객체

wsServer.on('request', (request) => {
  const connection = request.accept(null, request.origin);
  const clientId = request.key;  // 클라이언트 ID를 WebSocket 연결 키로 설정
  clients[clientId] = connection;

  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      console.log('Received message:', message.utf8Data);

      // 메시지를 JSON으로 파싱
      const msg = JSON.parse(message.utf8Data);

      // 메시지를 특정 클라이언트에게 전송
      if (msg.type === 'chat' && msg.receiver) {
        const receiverConnection = clients[msg.receiver];
        if (receiverConnection) {
          receiverConnection.sendUTF(message.utf8Data);
        }
      }
    }
  });

  connection.on('close', () => {
    console.log('WebSocket connection closed');
    delete clients[clientId];  // 연결이 닫힐 때 클라이언트 삭제
  });
});

// Server listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});




