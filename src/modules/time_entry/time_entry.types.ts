export type SerializedTimeEntry = {
  id: string;
  hours: number;
  description: string | null;
  userId: string;
  userName: string;
  createdAt: string;
  /** Only the author may delete this entry from the UI. */
  canDelete: boolean;
};
