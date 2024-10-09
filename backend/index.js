const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173','https://89txwgrx-5173.inc1.devtunnels.ms'], // Replace with your React app's origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

app.get('/', (req, res) => {
  res.send("<h1>Hello<h1/>");
});

const rooms = {}; // Define the rooms object to store room associations

io.on('connection', (socket) => {
  console.log('New user connected');

  socket.on('join-room', ({ roomID, Name }) => {
    socket.join(roomID);
    rooms[socket.id] = roomID; // Store the room the user is in
    console.log(`${Name} joined room: ${roomID}`);
  });

    socket.on('message', (data)=>{

       

            io.emit('message-broadcast',data)
    
        })
  
    // Handle offer, answer, and ice-candidate events
    socket.on('offer', (offer) => {
      const roomID = rooms[socket.id];
      socket.to(roomID).emit('offer', offer);
    });
  
    socket.on('answer', (answer) => {
      const roomID = rooms[socket.id];
      socket.to(roomID).emit('answer', answer);
    });
  
    socket.on('ice-candidate', (candidate) => {
      const roomID = rooms[socket.id];
      socket.to(roomID).emit('ice-candidate', candidate);
    });
  
    // Handle call ending for a specific user
    socket.on('end-call', () => {
      const roomID = rooms[socket.id];
      // Notify the other participants that this user has ended the call
      socket.to(roomID).emit('user-ended-call', socket.id); 
    });
  
    // When user disconnects
    socket.on('disconnect', () => {
        const roomID = rooms[socket.id];
        socket.leave(roomID);
        delete rooms[socket.id];
      });
  });
  

const port = 3005;
server.listen(port, () => console.log("Server is running on port", port));
