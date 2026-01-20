import Y from 'yjs';

export const snapshotFromYDoc = (ydoc: Y.Doc | undefined): Buffer => {
  if (!ydoc) return Buffer.from('');

  const update = Y.encodeStateAsUpdate(ydoc);
  return Buffer.from(update);
};
