import React, { useRef, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const PotholeDetector = ({ onBack }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isDetecting, setIsDetecting] = useState(false);

    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadDetections, setUploadDetections] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);
    const [detectionStats, setDetectionStats] = useState({ total: 0, currentFrame: 0 });
    const [detectionHistory, setDetectionHistory] = useState([]);

    useEffect(() => {
        let interval;
        if (isDetecting) {
            startCamera();
            interval = setInterval(detectFrame, 2000); // Check every 2 seconds
        } else {
            stopCamera();
            if (interval) clearInterval(interval);
            // Clear canvas when stopping
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
        return () => {
            stopCamera();
            if (interval) clearInterval(interval);
        };
    }, [isDetecting]);

    const startCamera = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError("Could not access camera: " + err.message);
            setIsDetecting(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const detectFrame = async () => {
        if (!videoRef.current || !canvasRef.current || !isDetecting) return;

        const video = videoRef.current;

        // Wait until video is ready
        if (video.readyState !== 4) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        // Draw current frame to convert to blob
        // We use a temporary canvas or just use the display canvas, but we need to send clean frame.
        // If we draw on display canvas, we might be drawing over old boxes if we don't clear.

        // 1. Draw clean video frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 2. Capture this frame for API
        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const formData = new FormData();
            formData.append('image', blob, 'frame.jpg');

            try {
                const response = await fetch(`${API_URL}/api/detect-pothole`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    // We only update boxes on success to avoid flickering
                    // Note: This is async, so the video might have moved on.
                    // This is "laggy overlay" but simplest for backend approach.
                    drawDetections(data.detections, context);

                    // Update detection statistics
                    setDetectionStats(prev => ({
                        total: prev.total + data.detections.length,
                        currentFrame: data.detections.length
                    }));

                    // Add to detection history
                    if (data.detections.length > 0) {
                        setDetectionHistory(prev => [
                            {
                                timestamp: new Date().toLocaleTimeString(),
                                count: data.detections.length,
                                detections: data.detections
                            },
                            ...prev.slice(0, 9) // Keep last 10 detections
                        ]);
                    }
                }
            } catch (err) {
                console.error("Detection error:", err);
            }
        }, 'image/jpeg', 0.8);
    };

    const drawDetections = (detections, context) => {
        // Redraw current video frame so boxes are on top of *latest* video?
        // No, if we redraw latest video, the boxes might be misaligned if camera moved.
        // Ideally we freeze frame or just draw on top of live video (augmented reality style).
        // Since we are redrawing on the canvas which is on top of the video...
        // Actually, in the JSX, I put <canvas> on top of <video>.
        // So I should Clear the canvas, and then draw boxes.
        // I don't need to draw the video image on the canvas unless I want to freeze it.
        // Let's keep the video playing in <video> tag, and use <canvas> transparently on top only for boxes.

        // Correct approach:
        // 1. Clear canvas.
        // 2. Draw boxes.

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        context.strokeStyle = '#00FF00'; // Green
        context.lineWidth = 4;
        context.font = 'bold 18px Arial';
        context.fillStyle = '#00FF00';

        detections.forEach(det => {
            const [x1, y1, x2, y2] = det.box;
            context.strokeRect(x1, y1, x2 - x1, y2 - y1);

            // Draw label background
            const label = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
            const textWidth = context.measureText(label).width;
            context.fillStyle = 'rgba(0,0,0,0.5)';
            context.fillRect(x1, y1 > 20 ? y1 - 25 : y1, textWidth + 10, 25);

            context.fillStyle = '#00FF00';
            context.fillText(label, x1 + 5, y1 > 20 ? y1 - 7 : y1 + 18);
        });
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(URL.createObjectURL(file));
            setUploadDetections([]);
            setError(null);
        }
    };

    const detectPotholesInImage = async () => {
        if (!selectedImage) return;

        setUploading(true);
        setError(null);

        try {
            const response = await fetch(selectedImage);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append('image', blob, 'uploaded_image.jpg');

            const detectResponse = await fetch(`${API_URL}/api/detect-pothole`, {
                method: 'POST',
                body: formData
            });

            if (detectResponse.ok) {
                const data = await detectResponse.json();
                setUploadDetections(data.detections);

                // Update detection statistics for uploaded image
                setDetectionStats(prev => ({
                    ...prev,
                    total: prev.total + data.detections.length
                }));

                // Add to detection history
                if (data.detections.length > 0) {
                    setDetectionHistory(prev => [
                        {
                            timestamp: new Date().toLocaleTimeString(),
                            count: data.detections.length,
                            detections: data.detections,
                            type: 'upload'
                        },
                        ...prev.slice(0, 9) // Keep last 10 detections
                    ]);
                }
            } else {
                setError('Failed to detect potholes in the image');
            }
        } catch (err) {
            setError('Error processing image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const drawUploadDetections = (detections, canvas) => {
        if (!canvas) return;

        const context = canvas.getContext('2d');

        // Clear canvas first
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = '#FF0000'; // Red for uploaded image detections
        context.lineWidth = 4;
        context.font = 'bold 18px Arial';
        context.fillStyle = '#FF0000';

        detections.forEach(det => {
            const [x1, y1, x2, y2] = det.box;
            context.strokeRect(x1, y1, x2 - x1, y2 - y1);

            // Draw label background
            const label = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
            const textWidth = context.measureText(label).width;
            context.fillStyle = 'rgba(0,0,0,0.5)';
            context.fillRect(x1, y1 > 20 ? y1 - 25 : y1, textWidth + 10, 25);

            context.fillStyle = '#FF0000';
            context.fillText(label, x1 + 5, y1 > 20 ? y1 - 7 : y1 + 18);
        });
    };

    const saveDetectionResults = (imageSrc, detections) => {
        // Create a temporary canvas to draw the image with detections
        const canvas = document.createElement('canvas');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Draw detections on the canvas
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 4;
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#FF0000';

            detections.forEach(det => {
                const [x1, y1, x2, y2] = det.box;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

                const label = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
                const textWidth = ctx.measureText(label).width;
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(x1, y1 > 20 ? y1 - 25 : y1, textWidth + 10, 25);

                ctx.fillStyle = '#FF0000';
                ctx.fillText(label, x1 + 5, y1 > 20 ? y1 - 7 : y1 + 18);
            });

            // Create download link
            const link = document.createElement('a');
            link.download = `pothole-detection-${new Date().toISOString().slice(0, 19)}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
        };

        img.src = imageSrc;
    };

    const saveLiveDetectionResults = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;

        // Create a new canvas to combine video frame and detections
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = video.videoWidth || 640;
        resultCanvas.height = video.videoHeight || 480;

        const ctx = resultCanvas.getContext('2d');

        // Draw current video frame
        ctx.drawImage(video, 0, 0, resultCanvas.width, resultCanvas.height);

        // Draw the detection overlay from the canvas
        const detectionCanvas = canvasRef.current;
        if (detectionCanvas) {
            // Copy the detection boxes from the overlay canvas to the result canvas
            const detectionCtx = detectionCanvas.getContext('2d');
            const imageData = detectionCtx.getImageData(0, 0, detectionCanvas.width, detectionCanvas.height);
            ctx.putImageData(imageData, 0, 0);
        }

        // Create download link
        const link = document.createElement('a');
        link.download = `live-pothole-detection-${new Date().toISOString().slice(0, 19)}.jpg`;
        link.href = resultCanvas.toDataURL('image/jpeg', 0.9);
        link.click();
    };

    const downloadDetectionHistory = () => {
        const dataStr = JSON.stringify(detectionHistory, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `detection-history-${new Date().toISOString().slice(0, 19)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const resetDetectionStats = () => {
        setDetectionStats({ total: 0, currentFrame: 0 });
        setDetectionHistory([]);
    };

    return (
        <div className="mt-6 flex flex-col items-center w-full">
            <h2 className="text-xl font-semibold mb-4 text-center">Live Pothole Detector</h2>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            {/* Live Camera Section */}
            <div className="w-full max-w-md mb-8">
                <h3 className="text-lg font-medium mb-2 text-center">Live Camera Detection</h3>
                <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
                    <div className="relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-auto block"
                            style={{ opacity: isDetecting ? 1 : 0.5 }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        />
                        {!isDetecting && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white font-medium bg-black bg-opacity-50 px-4 py-2 rounded">
                                    Camera Paused
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setIsDetecting(!isDetecting)}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium shadow-md transition transform active:scale-95 mt-2 ${isDetecting ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isDetecting ? 'Stop Detection' : 'Start Live Detection'}
                </button>

                <p className="text-sm text-gray-500 mt-2 text-center">
                    Point your camera at the road. Detections will be highlighted in real-time.
                </p>

                {isDetecting && detectionStats.currentFrame > 0 && (
                    <button
                        onClick={saveLiveDetectionResults}
                        className="w-full py-2 px-4 rounded text-white font-medium bg-purple-600 hover:bg-purple-700 mt-2"
                    >
                        Save Current Detection
                    </button>
                )}
            </div>

            {/* Upload Image Section */}
            <div className="w-full max-w-md mb-8">
                <h3 className="text-lg font-medium mb-2 text-center">Upload Image Detection</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="upload-image"
                    />
                    <label
                        htmlFor="upload-image"
                        className="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Choose Image
                    </label>

                    {selectedImage && (
                        <div className="mt-4 relative">
                            <div className="relative inline-block">
                                <img
                                    src={selectedImage}
                                    alt="Selected for detection"
                                    className="max-w-full h-auto rounded-lg"
                                    onLoad={(e) => {
                                        // Draw detections when image loads
                                        if (uploadDetections.length > 0) {
                                            const canvas = e.target.nextSibling;
                                            if (canvas) {
                                                drawUploadDetections(uploadDetections, canvas);
                                            }
                                        }
                                    }}
                                />
                                <canvas
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                    ref={(canvas) => {
                                        if (selectedImage && uploadDetections.length > 0 && canvas) {
                                            drawUploadDetections(uploadDetections, canvas);
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={detectPotholesInImage}
                                disabled={uploading}
                                className={`mt-2 w-full py-2 px-4 rounded text-white font-medium ${uploading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {uploading ? 'Detecting...' : 'Detect Potholes in Image'}
                            </button>

                            {uploadDetections.length > 0 && (
                                <button
                                    onClick={() => saveDetectionResults(selectedImage, uploadDetections)}
                                    className="mt-2 w-full py-2 px-4 rounded text-white font-medium bg-purple-600 hover:bg-purple-700"
                                >
                                    Save Detection Results
                                </button>
                            )}

                            {uploadDetections.length > 0 && (
                                <p className="mt-2 text-green-600 font-medium">
                                    Found {uploadDetections.length} pothole{uploadDetections.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Detection Statistics and History */}
            <div className="w-full max-w-md mb-8">
                <h3 className="text-lg font-medium mb-2 text-center">Detection Statistics</h3>
                <div className="bg-gray-50 p-4 rounded-lg shadow">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg shadow">
                            <p className="text-sm text-gray-600">Total Potholes Found</p>
                            <p className="text-2xl font-bold text-blue-600">{detectionStats.total}</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg shadow">
                            <p className="text-sm text-gray-600">Current Frame</p>
                            <p className="text-2xl font-bold text-green-600">{detectionStats.currentFrame}</p>
                        </div>
                    </div>

                    {detectionHistory.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Recent Detections</h4>
                            <div className="max-h-40 overflow-y-auto">
                                {detectionHistory.map((item, index) => (
                                    <div key={index} className="text-sm p-2 bg-white rounded mb-1 border">
                                        <span className="font-medium">{item.timestamp}</span> -
                                        <span className="text-blue-600"> {item.count} pothole{item.count !== 1 ? 's' : ''}</span>
                                        {item.type && <span className="text-xs text-gray-500 ml-1">(upload)</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {detectionHistory.length > 0 && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={downloadDetectionHistory}
                            className="py-2 px-4 rounded text-white font-medium bg-indigo-600 hover:bg-indigo-700"
                        >
                            Download History
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-4 mt-4">
                <button
                    onClick={resetDetectionStats}
                    className="text-gray-600 hover:text-gray-900 underline"
                >
                    Reset Stats
                </button>
                <button
                    onClick={onBack}
                    className="text-gray-600 hover:text-gray-900 underline"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default PotholeDetector;
