import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./websocket";
import itemRoutes from './routes/itemRoutes';
import cors from 'cors';

// Express server
const app = express();
const port = process.argv[2] || 5000;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static("public"));

// Create an HTTP server
const server = createServer(app);

// Initialize WebSocket server
setupWebSocket(server);

// Routes
app.use('/items', itemRoutes);

// Start server
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
