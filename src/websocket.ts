import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { prisma } from './utlis/prisma';
import type { Item, Folder } from './types';
import Redis from 'ioredis';

const redisPub = new Redis(); // Publisher
const redisSub = new Redis(); // Subscriber
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
    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());
      const {
        type,
        userId,
        item,
        folder,
        itemId,
        folderId,
        newOrder,
        collapsed,
      } = message;

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
    }

    if (!userRooms[userId]) {
      userRooms[userId] = [];
    }
    userRooms[userId].push(ws);
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
    }

    const message = { type: 'add_item', item };
    await redisPub.publish(
      'userUpdates',
      JSON.stringify({ userId, data: message })
    );
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
    }

    const message = { type: 'add_folder', folder };
    await redisPub.publish(
      'userUpdates',
      JSON.stringify({ userId, data: message })
    );
  };

  const handleMoveItem = async (
    userId: string,
    itemId: string,
    folderId: string | null,
    newOrder: number
  ) => {
    let existingFolder = await prisma.folder.findUnique({
      where: { id: itemId },
    });
    if (folderId === undefined) {
      folderId = null;
    }
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
    const message = { type: 'move_item', itemId, folderId, newOrder };
    await redisPub.publish(
      'userUpdates',
      JSON.stringify({ userId, data: message })
    );
  };

  const handleEditItem = async (
    userId: string,
    itemId: string,
    collapsed: boolean
  ) => {
    let existingFolder = await prisma.folder.findUnique({
      where: { id: itemId },
    });
    if (existingFolder) {
      await prisma.folder.update({
        where: { id: itemId },
        data: {
          collapsed,
        },
      });
    }
    const message = { type: 'edit_item', itemId, collapsed };
    await redisPub.publish(
      'userUpdates',
      JSON.stringify({ userId, data: message })
    );
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
