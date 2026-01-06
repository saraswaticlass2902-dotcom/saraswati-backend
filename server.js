

// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

// Routes
const authRoute = require("./routes/authRoute");
const transactionRoute = require("./routes/transactionRoute");
const stockRoute = require("./routes/stockRoute");
const profileRoutes = require("./routes/profileRoute");
const adminRoutes = require("./routes/adminRoute");
const contactRoutes = require("./routes/contactRoute");
const chatRoutes = require("./routes/chatRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const lectureRoutes = require("./routes/lectureRoutes");
const courseRoutes = require("./routes/courseRoutes");

// Models
const Chat = require("./models/chatModel");

// App
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not set");
  process.exit(1);
}

/* ======================= CORS (FINAL & SAFE) ======================= */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://saraswati-frontend.vercel.app",
    ],
    credentials: true,
  })
);

/* ======================= MIDDLEWARE ======================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static("public"));

/* ======================= ROOT ======================= */
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

/* ======================= DB EVENTS ======================= */
mongoose.connection.on("connected", () =>
  console.log("✅ MongoDB connected")
);
mongoose.connection.on("error", (err) =>
  console.error("❌ Mongo error:", err)
);

/* ======================= START ======================= */
async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    /* ======================= ROUTES ======================= */
    app.use("/api/auth", authRoute);
    app.use("/api/profile", profileRoutes);
    app.use("/api/transaction", transactionRoute);
    app.use("/api/stock", stockRoute);
    app.use("/api/admin", adminRoutes);
    app.use("/api", contactRoutes);
    app.use("/api/chat", chatRoutes);
    app.use("/api/purchases", purchaseRoutes);
    app.use("/api/lectures", lectureRoutes);
    app.use("/api/courses", courseRoutes);

    /* ======================= HTTP + SOCKET ======================= */
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:3000",
          "https://saraswati-frontend.vercel.app",
        ],
        credentials: true,
        methods: ["GET", "POST"],
      },
    });

    /* ======================= SOCKET LOGIC ======================= */
    const rooms = {};
    const pendingRequests = {};

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);

      socket.on("join-lecture", ({ roomId, role }) => {
        if (!roomId) return;
        socket.join(roomId);

        if (!rooms[roomId]) rooms[roomId] = { teacher: null, students: [] };
        if (!pendingRequests[roomId]) pendingRequests[roomId] = [];

        if (role === "teacher") {
          rooms[roomId].teacher = socket.id;
          io.to(socket.id).emit("pending-requests", pendingRequests[roomId]);
        } else {
          rooms[roomId].students.push(socket.id);
        }
      });

      socket.on("request-join", ({ roomId, name }) => {
        if (!roomId) return;
        const req = { name: name || "Student", socketId: socket.id };
        pendingRequests[roomId].push(req);

        const teacher = rooms[roomId]?.teacher;
        if (teacher) {
          io.to(teacher).emit("pending-requests", pendingRequests[roomId]);
        }
      });

      socket.on("approve-student", ({ roomId, studentSocketId }) => {
        pendingRequests[roomId] = pendingRequests[roomId].filter(
          (r) => r.socketId !== studentSocketId
        );
        io.to(studentSocketId).emit("approved", { roomId });
      });

      socket.on("save-chat", async (chatObj) => {
        try {
          await new Chat(chatObj).save();
          socket.emit("chat-saved", { ok: true });
        } catch (err) {
          socket.emit("chat-saved", { ok: false });
        }
      });

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });

    server.listen(PORT, () =>
      console.log(`🚀 Server running on PORT ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Start error:", err);
    process.exit(1);
  }
}

start();
