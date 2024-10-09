import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import SendIcon from '@mui/icons-material/Send';
import VideoCallIcon from '@mui/icons-material/VideoCall';
const socket = io("http://localhost:3005"); // Replace with your server address

export default function Chatroom() {
  const location = useLocation();
  const { Host, Name, RoomID } = location.state; // Ensure these props are passed correctly

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [otherUserEndedCall, setOtherUserEndedCall] = useState(false); // State to track if other user ended the call

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const inputRef = useRef(null)

  useEffect(() => {
    socket.emit('join-room', { roomID: RoomID, Name });

    socket.on('message-broadcast', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleICECandidate);
    socket.on('user-ended-call', () => setOtherUserEndedCall(true)); // Notify when another user ends the call

    return () => {
      socket.off('message-broadcast');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-ended-call');
    };
  }, [RoomID, Name]);

  const sendMessage = (event) => {
    event.preventDefault();
    if (message.trim()) {
      socket.emit('message', Name + ": " + message.trim());
      setMessage('');
    }
  };

  const startVideoCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    localVideoRef.current.srcObject = stream;

    const peerConnection = new RTCPeerConnection();
    peerConnectionRef.current = peerConnection;

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);

    setCallActive(true);
  };

  const handleOffer = async (offer) => {
    const peerConnection = new RTCPeerConnection();
    peerConnectionRef.current = peerConnection;

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    localVideoRef.current.srcObject = stream;

    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);

    setCallActive(true);
  };

  const handleAnswer = async (answer) => {
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleICECandidate = (candidate) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      localVideoRef.current.srcObject = null;
    }

    if (remoteStream) {
      setRemoteStream(null);
      remoteVideoRef.current.srcObject = null;
    }

    socket.emit('end-call');
    setCallActive(false);
  };


  return (
    <div style={{height:"100vh",display:"flex"}}>


<div style={{border:"2px solid white"}}>
          <video ref={localVideoRef} autoPlay muted style={{ width: "350px" , paddingLeft:"1%",paddingRight:"1%", marginTop:"5%",borderRadius:"20px"}}></video>
          <video ref={remoteVideoRef} autoPlay style={{ width: "350px" , paddingLeft:"1%",paddingRight:"1%", marginTop:"5%",borderRadius:"20px"}}></video>
          {callActive && !otherUserEndedCall && <button style={{
        backgroundColor:"red",
        color:"white",
        
        width:"10vw",
        marginLeft:"30%"
      }} onClick={endCall}>End Call</button>}

{otherUserEndedCall && <p style={{
        display: callActive ? "block" : "none"
      }}>
      <button
        style={{
          display: callActive ? "block" : "none",
          backgroundColor:"red",
          color:"white",
          width:"10vw",
          marginLeft:"30%"
        }}
      
        onClick={endCall} >End Call</button>
      </p>}
        </div>

    


      <div style={{ width: "71.5vw", padding: ".5%",backgroundColor:"whitesmoke",height: "100vh" }}>
        <div style={{ width: "70.6vw", backgroundColor: "Background", borderRadius: "5px", textAlign: "center", textDecoration: "underline" }}>
          <h3 style={{textAlign:"center",marginLeft:"20%"}}>Your Room ID: {RoomID}</h3>
          
        </div>


        <div style={{ height: "79vh", backgroundColor: "white", borderRadius: "5px", overflowY: "scroll", padding: "0%" }}>
          <div style={{display:"flex",flexDirection:"row",justifyContent:"space-evenly", backgroundColor:"blue"}}>
          <div>
          <h2 style={{paddingLeft:'5px',color:"white"}}>Welcome to the Chat Room, {Name} </h2>
          </div>
          
          <div>
          {Host? (
          
          <h2> {!callActive && <VideoCallIcon sx={
            {
              
              width:"3rem",
              height:"2rem",
              color:"white",
              border:"1px solid white",
              borderRadius:"5px"
            }
             } onClick={startVideoCall}/>}</h2>
           ):(
            <p style={{
              color:"white",
              textDecoration:"underline"
            }}>You're User, Video call can be done by host</p>
           )} 

          </div>
         
          </div>
        


     
          <ul style={{ paddingLeft: "4px" }}>
            {messages.map((msg, index) => {

              const isOutgoing = msg.trim().startsWith(Name + ":");

              return (

                <li

                  key={index}

                  style={{

                    listStyle: "none",

                    backgroundColor: isOutgoing ? "#DCF8C6" : "#FFF",

                    padding: "10px",

                    margin: "5px 0",

                    borderRadius: "10px",

                    textAlign: isOutgoing ? "right" : "left",
                    maxWidth: "70%",


                    whiteSpace: "normal",

                    display: "flex",

                  }}

                >

                  {msg}

                </li>

              );

            })}
          </ul>
        </div>

        <form style={{ marginTop: "0rem", display: "flex", flexDirection: "row", width: "100%" }} onSubmit={sendMessage}>
          <input
            ref={inputRef}
            style={{ width: "70vw", height: "5.3vh", borderRadius:"10px 0px 0px 10px",fontSize: "1.3rem" }}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
                 <SendIcon onClick={sendMessage} sx={{ border: "1px solid white", fontSize: "2px", backgroundColor: "white", textAlign: "center", height: "5.8vh", width: "2.5rem", borderRadius: "0px 10px 10px 0px" }} />
        </form>
      </div>
    </div>
  );
}
