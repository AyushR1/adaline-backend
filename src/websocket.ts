import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { prisma } from './utlis/prisma';
import Redis from 'ioredis';

const redisPub = new Redis(); // Publisher
const redisSub = new Redis(); // Subscriber

type UserRoom = {
  [userId: string]: WebSocket[];
};

export type Item = {
  id: string;
  name: string;
  icon: string;
  order: number;
  folder_id: string | null;
  userId: string;
  item_type?: string;
};

export type Folder = {
  id: string;
  name: string;
  order: number;
  folder_id: string | null;
  userId: string;
};

const userRooms: Record<string, WebSocket[]> = {};

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  // Subscribe to Redis channel
  redisSub.on('message', (channel, message) => {
    const { userId, data } = JSON.parse(message);

    if (channel === 'userUpdates' && userRooms[userId]) {
      broadcastToRoom(userId, data);
    }
  });
  redisSub.subscribe('userUpdates');

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected.');

    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());
      const { type, userId, item, folder, itemId, folderId, newOrder, collapsed } =
        message;

      switch (type) {
        case 'join':
          await handleJoin(userId, ws);
          break;

        case 'add_item':
          await handleAddItem(userId, item);
          break;

        case 'add_folder':
          await handleAddFolder(userId, folder);
          break;

        case 'move_item':
          await handleMoveItem(userId, itemId, folderId, newOrder);
          break;
        
        case 'edit_item':
          await handleEditItem(userId, itemId, collapsed);
          break;

        default:
          console.log(`Unknown message type: ${type}`);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected.');
      cleanUpUserRooms(ws);
    });
  });

  const broadcastToRoom = (userId: string, message: object) => {
    const sockets = userRooms[userId] || [];
    for (const socket of sockets) {
      socket.send(JSON.stringify(message));
    }
  };

  const handleJoin = async (userId: string, ws: WebSocket) => {
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Create a new user if not already present
      user = await prisma.user.create({
        data: {
          id: userId,
        },
      });
      console.log(`User ${userId} created.`);
    }

    if (!userRooms[userId]) {
      userRooms[userId] = [];
    }
    userRooms[userId].push(ws);
    console.log(`User ${userId} joined.`);
  };

  const handleAddItem = async (userId: string, item: Item) => {
    let existingItem = await prisma.item.findUnique({
      where: { id: item.id },
    });

    if (!existingItem) {
      await prisma.item.create({
        data: {
          id: item.id,
          name: item.name,
          order: item.order,
          folder_id: item.folder_id,
          icon: item.icon,
          userId,
        },
      });
      console.log(`Item ${item.name} added for user ${userId}`);
    }

    const message = { type: 'add_item', item };
    await redisPub.publish('userUpdates', JSON.stringify({ userId, data: message }));
  };

  const handleAddFolder = async (userId: string, folder: Folder) => {
    let existingFolder = await prisma.folder.findUnique({
      where: { id: folder.id },
    });

    if (!existingFolder) {
      await prisma.folder.create({
        data: {
          id: folder.id,
          name: folder.name,
          userId,
          folder_id: folder.folder_id,
          order: folder.order,
        },
      });
      console.log(`Folder ${folder.name} added for user ${userId}`);
    }

    const message = { type: 'add_folder', folder };
    await redisPub.publish('userUpdates', JSON.stringify({ userId, data: message }));
  };

  const handleMoveItem = async (
    userId: string,
    itemId: string,
    folderId: string | null,
    newOrder: number
  ) => {
    console.log('aaaaaaaaaaaa')
    let existingFolder = await prisma.folder.findUnique({
      where: { id: itemId },
    });
    if (existingFolder) {
      await prisma.folder.update({
        where: { id: itemId },
        data: {
          folder_id: folderId,
          order: newOrder,
        },
      });
    } else {
      await prisma.item.update({
        where: { id: itemId },
        data: {
          folder_id: folderId,
          order: newOrder,
        },
      });
    }
    console.log(`Item ${itemId} moved to folder ${folderId} for user ${userId}`);
    const message = { type: 'move_item', itemId, folderId, newOrder };
    await redisPub.publish('userUpdates', JSON.stringify({ userId, data: message }));
  };

  const handleEditItem = async (userId: string, itemId: string, collapsed: boolean ) => {
    console.log('aaaaaaaaaaaa')
    console.log(userId, itemId, collapsed)
    let existingFolder = await prisma.folder.findUnique({
      where: { id: itemId },
    });
    if (existingFolder) {
      await prisma.folder.update({
        where: { id: itemId },
        data: {
          collapsed
        },
      });
    }
    console.log(`Item ${itemId} edited for user ${userId}`);
    const message = { type: 'edit_item', itemId, collapsed };
    await redisPub.publish('userUpdates', JSON.stringify({ userId, data: message }));
  }
  const cleanUpUserRooms = (ws: WebSocket) => {
    for (const userId in userRooms) {
      userRooms[userId] = userRooms[userId].filter((socket) => socket !== ws);
      if (userRooms[userId].length === 0) {
        delete userRooms[userId];
      }
    }
  };
};
