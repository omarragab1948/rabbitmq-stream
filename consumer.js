import amqp from "amqplib";
import fs from "fs";

function handleMessage(msg) {
  const content = msg.content.toString();
  const parsedMessage = JSON.parse(content);

  // Extract specific properties within the 'file' object
  const fieldname = parsedMessage.file.fieldname;
  const originalname = parsedMessage.file.originalname;
  const encoding = parsedMessage.file.encoding;
  const mimetype = parsedMessage.file.mimetype;
  const destination = parsedMessage.file.destination;
  const filename = parsedMessage.file.filename;
  const path = parsedMessage.file.path;
  const size = parsedMessage.file.size;

  // Create a 'file' object with the extracted properties
  const fileObject = {
    fieldname,
    originalname,
    encoding,
    mimetype,
    destination,
    filename,
    path,
    size,
  };

  console.log(fileObject);

  // Create a video file from the 'fileObject'
  createVideoFile(fileObject);

}

// Function to create a video file from the 'fileObject'
function createVideoFile(fileObject) {
  const sourceFilePath = fileObject.path;
  const destinationFilePath = `./videos/${fileObject.filename}`;

  // Copy the file from the source path to the destination path
  fs.copyFile(sourceFilePath, destinationFilePath, (err) => {
    if (err) {
      console.error("Error creating video file:", err);
    } else {
      console.log(`Video file created: ${destinationFilePath}`);
    }
  });
}

// Connect to RabbitMQ server and create a channel
async function startConsumer() {
  try {
    const connection = await amqp.connect(
      "amqps://mzgsorhe:7WpAYGIA2shm6vHUT7yVrw9EO_gLHtj5@chimpanzee.rmq.cloudamqp.com/mzgsorhe"
    );
    const channel = await connection.createChannel();

    const queueName = "requestQueue"; // Specify the queue name you want to consume from

    // Ensure the queue exists
    await channel.assertQueue(queueName);

    // Set up a consumer to receive messages
    channel.consume(queueName, handleMessage, { noAck: true });

    console.log(`Consumer listening to ${queueName}`);
  } catch (error) {
    console.error("Error starting the consumer:", error);
  }
}

// Start the consumer
startConsumer();
