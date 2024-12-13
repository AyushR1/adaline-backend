import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";

type UserRoom = {
  [userId: string]: WebSocket[]; // Multiple connections per user
};
export type Item = {
  id: string;
  text: string;
  icon: string;
  order: number;
  folder_id: string | null;
};

export type Folder = {
  id: string;
  name: string;
  order: number;
  parent_folder: string | null;
};

const userRooms: Record<string, WebSocket[]> = {};

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected.");

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      const { type, userId, item,folder } = message;
      console.log(message)
      switch (type) {
        case "join":
          handleJoin(userId, ws);
          break;

        case "add_item":
          handleAddItem(userId, item);
          break;

        case "delete_item":
          handleDeleteItem(userId, item);
          break;

        case "add_folder":
          handleAddFolder(userId, folder);
          break;

        case "delete_folder":
          handleDeleteFolder(userId, folder);
          break;

        case "move_item":
          handleMoveItem(userId, item);
          break;

        case "move_folder":
          handleMoveFolder(userId, item);
          break;

        default:
          console.log(`Unknown message type: ${type}`);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected.");
      cleanUpUserRooms(ws);
    });
  });

  const broadcastToRoom = (userId: string, message: object) => {
    const sockets = userRooms[userId] || [];
    for (const socket of sockets) {
      console.log('aaaaaaaaaaaaaaaa')
      socket.send(JSON.stringify(message));
    }
  };

  const handleJoin = (userId: string, ws: WebSocket) => {
    if (!userRooms[userId]) {
      userRooms[userId] = [];
    }
    userRooms[userId].push(ws);
    console.log(`User ${userId} joined.`);
  };

  const handleAddItem = (userId: string, item: Item) => {
    // Logic to save item to the database
    console.log('aaaaaaaaaaaaaaaa', item)
    broadcastToRoom(userId, { type: "add_item", item });
  };

  const handleDeleteItem = (userId: string, itemId: string) => {
    // Logic to delete item from the database
    broadcastToRoom(userId, { type: "delete_item", itemId });
  };

  const handleAddFolder = (userId: string, folder: Folder) => {
    // Logic to save folder to the database
    broadcastToRoom(userId, { type: "add_folder", folder });
  };

  const handleDeleteFolder = (userId: string, folderId: string) => {
    // Logic to delete folder and handle cascading deletion of items or subfolders
    broadcastToRoom(userId, { type: "delete_folder", folderId });
  };

  const handleMoveItem = (userId: string, { itemId, folderId, newOrder }: { itemId: string; folderId: string | null; newOrder: number }) => {
    // Logic to update item's folder and order
    broadcastToRoom(userId, { type: "move_item", itemId, folderId, newOrder });
  };

  const handleMoveFolder = (userId: string, { folderId, parentFolderId, newOrder }: { folderId: string; parentFolderId: string | null; newOrder: number }) => {
    // Logic to update folder's parent and order
    broadcastToRoom(userId, { type: "move_folder", folderId, parentFolderId, newOrder });
  };

  const cleanUpUserRooms = (ws: WebSocket) => {
    for (const userId in userRooms) {
      userRooms[userId] = userRooms[userId].filter((socket) => socket !== ws);
      if (userRooms[userId].length === 0) {
        delete userRooms[userId];
      }
    }
  };
};
