import { Route, Routes } from "react-router-dom";
import "./App.css";
import TextEditor from "./pages/TextEditor";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { CreateRoom } from "./pages/CreateRoom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/room/:roomId" element={<TextEditor />} />
      </Routes>
    </>
  );
}

export default App;
