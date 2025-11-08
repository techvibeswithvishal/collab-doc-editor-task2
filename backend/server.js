const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Document = require('./models/Document');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// simple route
app.get('/', (req, res) => res.send('Collaborative Editor Backend Running'));

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || '';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// create server & socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// helper: find or create
async function findOrCreateDocument(id) {
  if (!id) return null;
  let doc = await Document.findById(id);
  if (doc) return doc;
  return await Document.create({ _id: id, data: '' });
}

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    if (!document) return;
    socket.join(documentId);
    socket.emit('load-document', document.data);

    socket.on('send-changes', (data) => {
      // data is full document text (string or HTML)
      socket.broadcast.to(documentId).emit('receive-changes', data);
    });

    socket.on('save-document', async (data) => {
      try {
        await Document.findByIdAndUpdate(documentId, { data });
      } catch (err) {
        console.error('Error saving document:', err.message);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
