import { Route, Routes } from "react-router-dom";
import "./App.css";
import TextEditor from "./pages/TextEditor";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { CreateRoom } from "./pages/CreateRoom";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Rooms from "./pages/Rooms";
import { UpdateRoom } from "./pages/UpdateRoom";

function App() {
  return (
    <>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/update-room/:roomId" element={<UpdateRoom />} />
            <Route path="/room/:roomId" element={<TextEditor />} />
          </Route>
        </Routes>
      </GoogleOAuthProvider>
    </>
  );
}

export default App;
