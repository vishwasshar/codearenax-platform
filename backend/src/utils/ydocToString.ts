import * as Y from 'yjs';

interface FileEntry {
  path: string;
  content: string;
}

export const ydocToString = (ydoc: Y.Doc | undefined): string => {
  return ydoc?.getText('index.js')?.toString() || '';
};

export const ydocToFiles = (ydoc: Y.Doc | undefined): FileEntry[] => {
  if (!ydoc) return [];
  const files: FileEntry[] = [];
  for (const name of ydoc.share.keys()) {
    const type = ydoc.share.get(name);
    if (type instanceof Y.Text) {
      files.push({ path: name, content: type.toString() });
    }
  }
  return files;
};
