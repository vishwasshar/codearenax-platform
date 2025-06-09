import React, { useState } from 'react';

import Editor from '@monaco-editor/react';
import * as monaco from "monaco-editor";

const languages = ["javascript","python","cpp"];

interface MyComponentProps {
  code: string;
  setCode:React.Dispatch<React.SetStateAction<string>>,
}

const TextEditor:React.FC<MyComponentProps> = ({code, setCode})=> {
  const [language,setLanguage] = useState<string>("javascript");


  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

  const handleCodeValidation = (markers:monaco.editor.IMarker[])=>{

    markers.forEach((marker:monaco.editor.IMarker) => {
      console.log(marker.message);
    });

  }

  return (
    <div className='w-full h-screen flex flex-col gap-2'>
      <div className='flex justify-end '>
        <select onChange={(e)=>{
          setLanguage(e.target.value);
        }} className="select select-ghost w-50">
          {languages.map((lang)=><option value={lang}>{lang}</option>)}
        </select>
      </div>
       <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleEditorChange}
        onValidate={handleCodeValidation}
      />
    </div>
  );
  
}


export default TextEditor;