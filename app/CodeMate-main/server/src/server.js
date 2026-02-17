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
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;

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

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
    },
    methods: ["GET", "POST"],
    credentials: true,
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
});

let userSocketMap = []; // Array to store user objects

// Function to get all users in a room
function getUsersInRoom(roomId) {
    return userSocketMap.filter((user) => user.roomId === roomId);
}

// Function to get room ID by socket ID
function getRoomId(socketId) {
    const roomId = userSocketMap.find(
        (user) => user.socketId === socketId
    )?.roomId;

    if (!roomId) {
        console.error("Room ID is undefined for socket ID:", socketId);
        return null;
    }
    return roomId;
}

// Function to get a user by socket ID
function getUserBySocketId(socketId) {
    const user = userSocketMap.find((user) => user.socketId === socketId);
    if (!user) {
        // console.error("User not found for socket ID:", socketId);
        return null;
    }
    return user;
}

// io.use((socket, next) => {
//     const token = socket.handshake.auth.token;
//     if (!token) {
//       return next(new Error('Authentication error: Token missing'));
//     }
  
//     jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//       if (err) {
//         return next(new Error('Authentication error: Invalid token'));
//       }
//       socket.userId = decoded.id; // Attach user ID to the socket
//       next();
//     });
// });

io.on("connection", (socket) => {

    socket.on(SocketEvent.JOIN_REQUEST, ({ roomId, username }) => {
        const isUsernameExist = getUsersInRoom(roomId).filter(
            (user) => user.username === username
        );
        if (isUsernameExist.length > 0) {
            // Notify the client that the username already exists
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

        // io.to(roomId).emit(SocketEvent.USER_JOINED, { user });
        socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user });
        io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users });
    });

    socket.on("disconnecting", () => {
		const user = getUserBySocketId(socket.id);
		
        if (!user) 
            return;

		const roomId = user.roomId;

		socket.broadcast.to(roomId).emit(SocketEvent.USER_DISCONNECTED, { user });
		
        
        userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id);
		socket.leave(roomId);
	});

	socket.on(SocketEvent.USER_OFFLINE, ({ socketId }) => {

		userSocketMap = userSocketMap.map((u) => {
			if (u.socketId === socketId) 
            {
				return { ...u, status: USER_CONNECTION_STATUS.OFFLINE };
			}
			return u;
		});

		const roomId = getRoomId(socketId);

		if (!roomId) 
            return;

		socket.broadcast.to(roomId).emit(SocketEvent.USER_OFFLINE, { socketId });
	});
    
    socket.on(SocketEvent.FILE_UPDATED, (data) => {
        const {fileId , newContent} = data;
        const roomId = getRoomId(socket.id)

		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_UPDATED, {
			fileId,
			newContent,
		})
    });

	socket.on(SocketEvent.USER_ONLINE, ({ socketId }) => {

		userSocketMap = userSocketMap.map((u) => {
			if (u.socketId === socketId)
            {
				return { ...u, status: USER_CONNECTION_STATUS.ONLINE };
			}
			return u;
		});

		const roomId = getRoomId(socketId);
		if (!roomId) 
            return;
		socket.broadcast.to(roomId).emit(SocketEvent.USER_ONLINE, { socketId });
	});

    socket.on(SocketEvent.TYPING_START, ({ cursorPosition }) => {

		userSocketMap = userSocketMap.map((u) => {
			if (u.socketId === socket.id) 
            {
				return { ...u, typing: true, cursorPosition }
			}
			return u;
		});

		const user = getUserBySocketId(socket.id);
		
        if (!user)
            return;

		const roomId = user.roomId;

		socket.broadcast.to(roomId).emit(SocketEvent.TYPING_START, { user });
	});

	socket.on(SocketEvent.TYPING_PAUSE, () => {
		userSocketMap = userSocketMap.map((u) => {
			if (u.socketId === socket.id) 
            {
				return { ...u, typing: false };
			}
			return u;
		});

		const user = getUserBySocketId(socket.id);

		if (!user)
            return;

		const roomId = user.roomId;

		socket.broadcast.to(roomId).emit(SocketEvent.TYPING_PAUSE, { user });
	});

    socket.on(SocketEvent.SEND_MESSAGE, ({ msg }) => {
        let roomId = getRoomId(socket.id);
        
        if(!roomId)
            return;

        socket.broadcast.to(roomId).emit(SocketEvent.RECEIVE_MESSAGE, {msg});
    });

    socket.on(SocketEvent.FILE_CREATED,(newFile) => {
        
        let roomId = getRoomId(socket.id);
        socket.broadcast.to(roomId).emit(SocketEvent.FILE_CREATED,newFile)
    });
    
    socket.on(SocketEvent.FILE_RENAMED, ({ fileId, newName }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_RENAMED, {
			fileId,
			newName,
		})
	});
    
    socket.on(SocketEvent.FILE_DELETED, ({ fileId }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_DELETED, { fileId })
	});
    
    socket.on(SocketEvent.SYNC_FILE_STRUCTURE, ({files, openFiles, activeFile, socketId}) => {
        
        io.to(socketId).emit(SocketEvent.SYNC_FILE_STRUCTURE, { files, openFiles, activeFile });
    });

    socket.on("drawing-update", (elements) => {
        const roomId = getRoomId(socket.id);
        if (!roomId) return; // Ensure socket is in a valid room
        
        // Broadcast only to users in the same room
        socket.broadcast.to(roomId).emit("drawing-update", elements);
    });
    
});

// api routes
app.use("/api/code", executeCodeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/room", roomRoutes);

// Global error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// mongodb connection

mongoose.connect(process.env.MONGODB_CONNECTION).then(()=>
{
    server.listen(PORT, ()=>
    {
        console.log(` Server is live on port ${PORT}`);
    })
})
.catch((err)=>
{
    console.log(err);
})

