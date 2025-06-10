import { Route, Routes } from 'react-router-dom';
import './App.css';
import TextEditor from './pages/TextEditor';

function App() {

  return (
    <>
      <Routes>
        <Route path="/room/:roomId" element={<TextEditor/>}/>
      </Routes>
    </>
  )
}

export default App
