import * as Y from 'yjs';

interface FileEntry {
  path: string;
  content: string;
}

export const stringToYDoc = (files: FileEntry[]): Y.Doc => {
  const ydoc = new Y.Doc();
  for (const file of files) {
    const ytext = ydoc.getText(file.path);
    ytext.insert(0, file.content || '');
  }
  return ydoc;
};
