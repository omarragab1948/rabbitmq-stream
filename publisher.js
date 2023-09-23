import path from "path";
import express from "express";
import cors from "cors";
import multer from "multer";
import amqp from "amqplib";

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

// Configure Multer to handle file uploads
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    cb(null, Date.now() + extname);
  },
});

const upload = multer({ storage });
const blobUrlArray = [];

// Establish a connection to RabbitMQ server when the application starts
let connection;
(async () => {
  try {
    connection = await amqp.connect(
      "amqps://mzgsorhe:7WpAYGIA2shm6vHUT7yVrw9EO_gLHtj5@chimpanzee.rmq.cloudamqp.com/mzgsorhe"
    );
    console.log("Connected to RabbitMQ");
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
})();

// Function to sanitize the req object and remove circular references
function sanitizeRequest(req) {
  const sanitizedReq = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    file: req.file,
    // Add other relevant properties from req as needed
  };
  return sanitizedReq;
}

// Define a route for video uploads
app.post("/upload", upload.single("video"), async (req, res) => {
  const uploadedVideo = req.file;
  blobUrlArray.push(uploadedVideo);

  try {
    if (!connection) {
      throw new Error("RabbitMQ connection is not established");
    }

    const channel = await connection.createChannel();

    const queueName = "requestQueue"; // Specify the queue name

    // Sanitize the req object and send it as a JSON string to RabbitMQ
    const sanitizedReq = sanitizeRequest(req);
    console.log(sanitizedReq);
    const reqData = JSON.stringify(sanitizedReq);
    channel.assertQueue(queueName);

    // Send the message to RabbitMQ
    await channel.sendToQueue(queueName, Buffer.from(reqData));

    console.log("Request sent to RabbitMQ");

    res.status(200).json({ message: "Video uploaded successfully" });
  } catch (error) {
    console.error("Error sending file content to RabbitMQ:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
