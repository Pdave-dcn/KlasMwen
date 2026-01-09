import type { Server, Socket } from "socket.io";

export const registerSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    const userRoom = `user:${user.id}`;

    void socket.join(userRoom);

    console.log(`User ${user.id} joined room ${userRoom}`);

    socket.on("disconnect", () => {
      console.log(`User ${user.id} disconnected`);
    });
  });
};
