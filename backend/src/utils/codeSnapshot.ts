import Y from 'yjs';

export const snapshotFromYDoc = (ydoc: Y.Doc | undefined): Uint8Array => {
  if (!ydoc) return Uint8Array.from('');

  const update = Y.encodeStateAsUpdate(ydoc);
  return Uint8Array.from(update);
};
