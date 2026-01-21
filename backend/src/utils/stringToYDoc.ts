import * as Y from 'yjs';

export const stringToYDoc = (text: string): Y.Doc => {
  const ydoc = new Y.Doc();
  const ytext = ydoc.getText('monaco');
  ytext.insert(0, text || '');
  return ydoc;
};
