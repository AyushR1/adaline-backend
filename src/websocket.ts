import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";

type UserRoom = {
  [userId: string]: WebSocket[]; // Multiple connections per user
};

const userRooms: UserRoom = {};

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected.");

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      const { type, userId, item } = message;

      if (type === "join") {
        // Assign user to a room
        if (!userRooms[userId]) {
          userRooms[userId] = [];
        }
        userRooms[userId].push(ws);
        console.log(`User ${userId} joined.`);
      } else if (type === "add_item") {
        // Broadcast item addition to the user's room
        broadcastToRoom(userId, { type: "item_added", item });
      } else if (type === "delete_item") {
        // Broadcast item deletion to the user's room
        broadcastToRoom(userId, { type: "item_deleted", item });
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected.");
      // Clean up user rooms
      for (const userId in userRooms) {
        userRooms[userId] = userRooms[userId].filter((socket) => socket !== ws);
        if (userRooms[userId].length === 0) {
          delete userRooms[userId];
        }
      }
    });
  });

  const broadcastToRoom = (userId: string, message: object) => {
    const sockets = userRooms[userId] || [];
    for (const socket of sockets) {
      socket.send(JSON.stringify(message));
    }
  };
};
