import { useEffect, useState } from 'react';

import Editor from '@monaco-editor/react';
import * as monaco from "monaco-editor";
import { socket } from '../utils/socket';

const languages = ["javascript","python","cpp"];


const TextEditor = ()=> {
    
    const [code, setCode] = useState<string>("");
    const [language,setLanguage] = useState<string>("javascript");

  useEffect(()=>{
    const delayDebounce =setTimeout(()=>{
      try{
        socket.emit("code:sync",code);
      }catch(err){
        console.log(err);
      }
    },250);


    return ()=>clearTimeout(delayDebounce);
  },[code]);

  useEffect(()=>{
    socket.connect();

    socket.on("code:updatedCode",(data:string) => {
      setCode(data);
    })

    return ()=>{
      socket.off("code:updatedCode");
      socket.disconnect();
    }
  },[]);
  


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