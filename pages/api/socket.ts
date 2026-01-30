import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";
import { NextApiResponseServerIO } from "../../utils/types";

export const config = {
    api: {
        bodyParser: false,
    },
};

const socketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
    if (!res.socket.server.io) {
        console.log("New Socket.io server...");
        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: "/api/socket",
            addTrailingSlash: false,
        });
        res.socket.server.io = io;

        io.on("connection", (socket) => {
            console.log("Socket connected:", socket.id);

            socket.on("join-room", (taskId: string) => {
                socket.join(taskId);
                console.log(`Socket ${socket.id} joined room ${taskId}`);
            });

            socket.on("send-message", (message: any) => {
                // In a real app, you'd save this to Firestore here
                // For simplicity, we emit it to the room
                io.to(message.taskId).emit("new-message", message);
            });

            socket.on("disconnect", () => {
                console.log("Socket disconnected:", socket.id);
            });
        });
    }
    res.end();
};

export default socketHandler;
