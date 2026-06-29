import * as Y from 'yjs';

interface WhiteboardData {
  records: Record<string, any>;
  meta?: Record<string, any>;
}

export const ydocToWhiteboardData = (ydoc: Y.Doc | undefined): WhiteboardData | null => {
  if (!ydoc) return null;
  const wbMap = ydoc.getMap<any>('wb');
  const records: Record<string, any> = {};
  for (const [key, value] of wbMap) {
    if (key !== '__meta') {
      try {
        records[key] = typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        records[key] = value;
      }
    }
  }
  const metaRaw = wbMap.get('__meta');
  const meta = typeof metaRaw === 'string' ? JSON.parse(metaRaw) : metaRaw;
  return { records, meta };
};

export const populateYdocWhiteboard = (
  ydoc: Y.Doc,
  whiteboardData: Buffer | null,
  whiteboardMeta: Record<string, any> | null,
) => {
  if (!whiteboardData) return;
  const wbMap = ydoc.getMap<any>('wb');
  const tempDoc = new Y.Doc();
  Y.applyUpdate(tempDoc, whiteboardData);
  const sourceMap = tempDoc.getMap<any>('wb');
  for (const [key, value] of sourceMap) {
    wbMap.set(key, value);
  }
  tempDoc.destroy();
  if (whiteboardMeta) {
    wbMap.set('__meta', JSON.stringify(whiteboardMeta));
  }
};
