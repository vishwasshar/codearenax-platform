import { Route, Routes } from "react-router-dom";
import "./App.css";
import TextEditor from "./pages/TextEditor";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { CreateRoom } from "./pages/CreateRoom";
import ProtectedRoutes from "./routes/ProtectedRoutes";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/room/:roomId" element={<TextEditor />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
