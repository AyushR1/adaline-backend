import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./websocket";

// Express server
const app = express();
const port = 5000;

// Serve static files
app.use(express.static("public"));

// Create an HTTP server
const server = createServer(app);

// Initialize WebSocket server
setupWebSocket(server);

// Start server
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
