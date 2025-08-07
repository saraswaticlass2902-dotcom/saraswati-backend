
require('dotenv').config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const authRoute = require("./routes/authRoute");
const transactionRoute = require("./routes/transactionRoute");
const stockRoute = require("./routes/stockRoute");
const profileRoutes = require("./routes/profileRoute");
const adminRoutes = require("./routes/adminRoute");
const contactRoutes = require("./routes/contactRoute");
const chatRoutes = require("./routes/chatRoutes");
const Chat = require("./models/chatModel"); 
const alluser = require("./routes/authRoute"); 

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


mongoose
  .connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


app.use("/api/auth", authRoute);
app.use("/api/transaction", transactionRoute);
app.use("/api/stock", stockRoute);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", contactRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/registration", alluser);



app.get("/", (req, res) => {
  res.send("Investment Server is Running");
});


io.on("connection", (socket) => {
   //console.log("🟢 New client connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    const { sender, receiver, email, message, time } = data;

  
    try {
      const chat = new Chat({ sender, receiver, email, message, time });
      await chat.save();
      io.emit("receiveMessage", data); 
    } catch (err) {
      console.error(" Error saving chat:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});


server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
