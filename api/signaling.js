// Vercel Serverless Function для WebSocket через Socket.io
import { Server } from 'socket.io';

const users = new Map();

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    
    io.on('connection', (socket) => {
      console.log('New connection:', socket.id);

      socket.on('register', (username) => {
        users.set(username, socket.id);
        socket.username = username;
        socket.emit('registered', { username });
        socket.broadcast.emit('user-online', { username });
      });

      socket.on('search', (query) => {
        const results = Array.from(users.keys()).filter(u => 
          u !== socket.username && u.toLowerCase().includes(query.toLowerCase())
        );
        socket.emit('search-results', { results });
      });

      socket.on('offer', ({ to, payload }) => {
        const targetId = users.get(to);
        if (targetId) {
          io.to(targetId).emit('offer', { from: socket.username, payload });
        }
      });

      socket.on('answer', ({ to, payload }) => {
        const targetId = users.get(to);
        if (targetId) {
          io.to(targetId).emit('answer', { from: socket.username, payload });
        }
      });

      socket.on('ice-candidate', ({ to, payload }) => {
        const targetId = users.get(to);
        if (targetId) {
          io.to(targetId).emit('ice-candidate', { from: socket.username, payload });
        }
      });

      socket.on('disconnect', () => {
        if (socket.username) {
          users.delete(socket.username);
          socket.broadcast.emit('user-offline', { username: socket.username });
        }
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
