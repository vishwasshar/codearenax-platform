import './App.css';
import TextEditor from "./components/TextEditor";
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';


const socket:Socket = io("http://localhost:3002");

function App() {

  const [code, setCode] = useState<string>("");

  useEffect(()=>{
    const delayDebounce =setTimeout(()=>{
      try{
        socket.emit("code:sync",code);
      }catch(err){
        console.log(err);
      }
    },1000);


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

  return (
    <>
      <TextEditor code={code} setCode={setCode} />
    </>
  )
}

export default App
