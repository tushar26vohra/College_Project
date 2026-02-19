require('dotenv').config();
const { SocketEvent, USER_CONNECTION_STATUS } = require('./types');
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const executeCodeRoutes = require("./routes/execute-routes");
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const allowedOrigins = [
    process.env.DEVELOPMENT_FRONTEND_URL,
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(express.static(path.join(__dirname, "../public")));


// ✅ HEALTH CHECK ROUTE (VERY IMPORTANT FOR ALB)
app.get("/", (req, res) => {
    res.status(200).send("Backend Running");
});


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
});

let userSocketMap = [];

function getUsersInRoom(roomId) {
    return userSocketMap.filter((user) => user.roomId === roomId);
}

function getRoomId(socketId) {
    return userSocketMap.find((user) => user.socketId === socketId)?.roomId;
}

function getUserBySocketId(socketId) {
    return userSocketMap.find((user) => user.socketId === socketId);
}

io.on("connection", (socket) => {

    socket.on(SocketEvent.JOIN_REQUEST, ({ roomId, username }) => {
        const isUsernameExist = getUsersInRoom(roomId).filter(
            (user) => user.username === username
        );

        if (isUsernameExist.length > 0) {
            io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS);
            return;
        }

        const user = {
            username,
            roomId,
            status: USER_CONNECTION_STATUS.ONLINE,
            cursorPosition: 0,
            typing: false,
            socketId: socket.id,
            currentFile: null,
        };

        userSocketMap.push(user);
        socket.join(roomId);

        const users = getUsersInRoom(roomId);

        socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user });
        io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users });
    });

    socket.on("disconnecting", () => {
        const user = getUserBySocketId(socket.id);
        if (!user) return;

        const roomId = user.roomId;
        socket.broadcast.to(roomId).emit(SocketEvent.USER_DISCONNECTED, { user });

        userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id);
        socket.leave(roomId);
    });
});


// API ROUTES
app.use("/api/code", executeCodeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/room", roomRoutes);


// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});


// MONGODB CONNECTION
mongoose.connect(process.env.MONGODB_CONNECTION)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
    });
