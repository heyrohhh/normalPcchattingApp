import { Route,Routes,BrowserRouter } from "react-router-dom";
import Signup from "./entry/signup";
import {v4 as uuidv4, v4} from 'uuid';
import Chatroom from "./chatroom/chatroom";
import { useState } from 'react';
import './App.css';

function App() {
    
    const [name, setName] = useState("");   
    const [userName, setUserName] = useState("");   

     const roomId = v4();
     
    return (
        <>
          

            <Routes>

            <Route path="/" element={<Signup  roomId={roomId} setName={setName} name={name} setUserName={setUserName} 
            userName={userName} />}></Route>
            <Route  path="/:roomId"   element={< Chatroom name={name} userName={userName} />} />
            </Routes>
          
         
        </>
    );
}

export default App;
