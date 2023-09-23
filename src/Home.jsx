import React, { useState, useEffect, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import axios from "axios";

const Home = () => {
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
    useReactMediaRecorder({ video: true });
  const [isRecording, setIsRecording] = useState(true); // Start recording automatically
  const videoRef = useRef(null);
  useEffect(() => {
    async function openCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }

    openCamera();

    return () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
      }
    };
  }, []);
  useEffect(() => {
    let intervalId;

    if (isRecording) {
      intervalId = setInterval(() => {
        stopRecording(); // Stop the current recording
        clearBlobUrl(); // Clear the previous blob URL

        startRecording(); // Start a new recording
      }, 10000);
    } else {
      clearInterval(intervalId); // Clear the interval when recording is stopped
    }

    return () => {
      clearInterval(intervalId); // Clear the interval when component unmounts
    };
  }, [isRecording, startRecording, stopRecording, clearBlobUrl, mediaBlobUrl]);

  useEffect(() => {
    if (status === "stopped" && mediaBlobUrl) {
      handleUpload();
    }
  }, [status, mediaBlobUrl]);

  const handleUpload = async () => {
    try {
      // Convert Blob URL to Blob Object
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();

      // Create a File with the desired filename and extension
      const fileName = "video.mp4";
      const videoFile = new File([blob], fileName, { type: "video/mp4" });

      // Create FormData and append the File
      const formData = new FormData();
      formData.append("video", videoFile);

      // Send the FormData via Axios
      const uploadResponse = await axios.post(
        "http://localhost:3000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Video uploaded successfully!", uploadResponse.data);
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  };

  return (
    <div>
      <div style={{ width: "400px", margin: "auto" }}>
        <video ref={videoRef} autoPlay playsInline />
      </div>
    </div>
  );
};

export default Home;
