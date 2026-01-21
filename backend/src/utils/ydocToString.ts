import * as Y from 'yjs';

export const ydocToString = (ydoc: Y.Doc | undefined): string => {
  return ydoc?.getText('monaco')?.toString() || '';
};
