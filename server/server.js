const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

wss.on('connection', (ws) => {
  console.log('Client connected');
  const chat = model.startChat({ history: [] });

  ws.on('message', async (message) => {
    const { text } = JSON.parse(message);

    // Send typing indicator
    ws.send(JSON.stringify({ type: 'typing', isTyping: true }));

    try {
      const result = await chat.sendMessage(text);
      const response = result.response.text();

      ws.send(JSON.stringify({ type: 'message', text: response }));
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', text: 'Something went wrong.' }));
    } finally {
      ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

server.listen(3001, () => console.log('Server on port 3001'));

app.get('/test', async (req, res) => {
  const result = await model.generateContent("Say hello!");
  res.json({ response: result.response.text() });
});