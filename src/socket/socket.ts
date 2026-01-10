import { io } from "../index.js";
import jwt from "jsonwebtoken";

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if(!token){
        return new Error("Unauthorized")
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    next(new Error("Unauthorized"));
  }
});
io.on("connection", (socket) => {
  const userId = socket.data.user.id;

  socket.join(userId);
  console.log("user joined:", userId);
  socket.on("disconnect",()=>{
    console.log("user disconnected");
  })
});
