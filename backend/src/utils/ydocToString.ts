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

  // Materialize and read the files array (which stores path + lang metadata)
  const filesArr = ydoc.getArray<{ path: string; lang: string }>('files');
  for (const entry of filesArr.toArray()) {
    const content = ydoc.getText(entry.path).toString();
    files.push({ path: entry.path, content });
  }

  // Fallback: if files array is empty, scan share keys for any Y.Text types
  if (files.length === 0) {
    for (const name of ydoc.share.keys()) {
      const type = ydoc.share.get(name);
      if (name !== 'files' && type instanceof Y.Text) {
        files.push({ path: name, content: type.toString() });
      }
    }
  }

  return files;
};
