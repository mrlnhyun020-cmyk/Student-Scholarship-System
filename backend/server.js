require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/students", require("./routes/student"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/scholarship", require("./routes/scholarship"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/ai", require("./routes/ai"));

// Test route
app.get("/", (req, res) => {
  res.send("Student Scholarship System API is running!");
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();