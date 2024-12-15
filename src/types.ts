import { Decimal } from "@prisma/client/runtime/library";

export type Item = {
  id: string;
  name: string;
  icon: string;
  order?: any;
  folder_id?: string | null | undefined;
  userId?: string;
  item_type?: string;
};

export type Folder = {
  id: string;
  name: string;
  order?:  any;
  folder_id?: string | null;
  userId?: string;
  collapsed?: boolean;
  item_type?: string;
  children?: Folder[] | Item[] | null | undefined;
};
