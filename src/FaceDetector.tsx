// FaceDetector.tsx
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from 'face-api.js';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 360;

const FaceDetector: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [facesDetected, setFacesDetected] = useState(0);
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const detectionInterval = useRef<NodeJS.Timeout>();

  const videoConstraints = {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    facingMode: "user",
  };

  // Carga los modelos de face-api.js
  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
      setIsModelLoaded(true);
      console.log("Modelos cargados correctamente");
    } catch (error) {
      console.error("Error al cargar los modelos:", error);
    }
  };

  // Detecta rostros en el video
  const detectFaces = async () => {
    if (!webcamRef.current?.video || !canvasRef.current || !isModelLoaded || !detectionEnabled) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };
    
    // Asegurarse de que las dimensiones del canvas coincidan con el video
    faceapi.matchDimensions(canvas, displaySize);
    
    const detections = await faceapi.detectAllFaces(
      video, 
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptors();
    
    // Actualizar el número de rostros detectados
    setFacesDetected(detections.length);
    
    // Limpiar canvas y dibujar detecciones
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  };

  // Iniciar la detección de rostros al cargar el componente
  useEffect(() => {
    loadModels();
    
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  // Configurar el intervalo de detección cuando los modelos están cargados
  useEffect(() => {
    if (isModelLoaded && detectionEnabled) {
      detectionInterval.current = setInterval(detectFaces, 100);
    } else if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isModelLoaded, detectionEnabled]);

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <h2>Detección de Rostros</h2>
      
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setDetectionEnabled(!detectionEnabled)}
          style={{
            padding: "8px 16px",
            backgroundColor: detectionEnabled ? "#ff4757" : "#2ed573",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {detectionEnabled ? "Pausar Detección" : "Iniciar Detección"}
        </button>
      </div>
      
      <div style={{ position: "relative", display: "inline-block" }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          videoConstraints={videoConstraints}
          screenshotFormat="image/jpeg"
          style={{ borderRadius: "8px" }}
        />
        
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 10
          }}
        />
        
        <div style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "4px",
          fontSize: "14px"
        }}>
          Rostros detectados: {facesDetected}
        </div>
      </div>
      
      {!isModelLoaded && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "20px",
          borderRadius: "10px",
          zIndex: 20
        }}>
          Cargando modelos de detección...
        </div>
      )}
    </div>
  );
};

export default FaceDetector;