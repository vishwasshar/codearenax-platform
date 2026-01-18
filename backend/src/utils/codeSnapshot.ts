import Y from 'yjs';

export const snapshotFromYDoc = (ydoc: Y.Doc): Buffer => {
  const update = Y.encodeStateAsUpdate(ydoc);
  return Buffer.from(update);
};
