import { createServer } from "node:http";
import { app } from "./server.js";
import { Server } from "socket.io";

const httpServer = createServer(app);

export const io = new Server({
  cors: { origin: "*" },
});

httpServer.listen(3000, () => {
  console.log("Server is listening on port", 3000);
});
