import { Request, Response } from 'express';
import { prisma } from '../utlis/prisma';
import { Folder } from '../types';


const buildFolderHierarchy = async (
  folderId: string | null,
  userId: string
): Promise<Folder | null> => {
  if (!folderId) return null;

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    include: {
      items: true,
      subFolders: true,
    },
  });

  const itemsWithItemType =
    folder?.items.map((item) => ({
      ...item,
      item_type: 'item',
      order: item.order ? new Number(item.order) : null,
      children: [],
    })) || [];

  if (!folder) return null;

  const subFoldersChildren = await Promise.all(
    folder.subFolders.map((subFolder: { id: string }) =>
      buildFolderHierarchy(subFolder.id, userId)
    )
  );

  return {
    id: folder.id,
    name: folder.name,
    order: folder.order ? new Number(folder.order) : null, 
    collapsed: folder.collapsed,
    item_type: 'folder',
    children: [...subFoldersChildren, ...itemsWithItemType] as any,
  };
};

export const getItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.user_id as string;

    // Fetch all root folders (parentFolderId is null)
    const rootFolders = await prisma.folder.findMany({
      where: { userId, folder_id: null },
    });

    // Fetch standalone items that are not linked to any folder
    const standaloneItems = await prisma.item.findMany({
      where: {
        userId,
        folder_id: null, // Items that are not linked to any folder
      },
    });

    // Build the folder hierarchy for each root folder
    const hierarchy = await Promise.all(
      rootFolders.map((folder) => buildFolderHierarchy(folder.id, userId))
    );
    const itemsWithItemType = standaloneItems.map((item) => ({
      ...item,
      item_type: 'item',
      collapsed: false,
      order: item.order ? new Number(item.order) : null,
      children: [],
    }));
    res.status(200).json([...hierarchy, ...itemsWithItemType]);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
