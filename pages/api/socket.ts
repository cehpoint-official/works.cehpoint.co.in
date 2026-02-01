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
            console.log(`[Socket] Client connected: ${socket.id}`);

            socket.on("join-room", (taskId: string) => {
                if (!taskId) return;
                socket.join(taskId);
                console.log(`[Socket] Client ${socket.id} joined room: ${taskId}`);
            });

            socket.on("send-message", (message: any) => {
                if (!message || !message.taskId) return;
                console.log(`[Socket] Message broadcast to room ${message.taskId}`);
                io.to(message.taskId).emit("new-message", message);
            });

            socket.on("error", (err) => {
                console.error(`[Socket] Connection error:`, err);
            });

            socket.on("disconnect", (reason) => {
                console.log(`[Socket] Client disconnected: ${socket.id} (Reason: ${reason})`);
            });
        });
    }
    res.end();
};

export default socketHandler;
