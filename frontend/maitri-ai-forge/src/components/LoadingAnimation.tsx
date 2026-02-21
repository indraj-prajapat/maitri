import React, { useState, useEffect } from 'react';
import { FileText, FileCheck, Brain, BrainCircuit } from 'lucide-react';

const StatusMessages = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const messages = [
    "Analyzing source file structure...",
    "Identifying data patterns and schemas...",
    "Comparing source and target formats...",
    "Detecting field relationships...",
    "Processing data transformations...",
    "Establishing mapping connections...",
    "Validating data types and constraints...",
    "Generating transformation rules...",
    "Optimizing mapping strategies...",
    "Ensuring data integrity checks...",
    "Formatting output structures...",
    "Creating mapping documentation...",
    "Verifying mapping accuracy...",
    "Finalizing transformation pipeline...",
    "Preparing mapping configuration..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-8 overflow-hidden">
      {messages.map((message, index) => (
        <div
          key={index}
          className="absolute inset-0 flex items-center justify-center transition-all duration-700"
          style={{
            opacity: index === currentIndex ? 1 : 0,
            transform: index === currentIndex ? 'translateY(0)' : index < currentIndex ? 'translateY(-20px)' : 'translateY(20px)'
          }}
        >
          <span className="text-purple-500 font-semibold text-sm">{message}</span>
        </div>
      ))}
    </div>
  );
};

const LoadingAnimation = ({ leftFiles = [], rightFiles = [] }) => {
  const [dataPoints, setDataPoints] = useState([]);
  const [mappingFlows, setMappingFlows] = useState([]);
  const [progressm, setProgressm] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://127.0.0.1:5000/api/progress")
        .then((res) => res.json())
        .then((data) => {
          setProgressm(data.progress);
        })
        .catch((err) => console.error("Progress fetch error:", err));
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const newId = Date.now() + Math.random();
      const fromSource = Math.random() > 0.5;
      
      setDataPoints(prev => [
        ...prev,
        {
          id: newId,
          fromSource,
          progress: 0
        }
      ]);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setDataPoints(prev => 
        prev
          .map(point => ({ ...point, progress: point.progress + 2 }))
          .filter(point => point.progress <= 100)
      );
    }, 20);

    return () => clearInterval(animationInterval);
  }, []);

  useEffect(() => {
    const mappingInterval = setInterval(() => {
      const newId = Date.now() + Math.random();
      
      setMappingFlows(prev => [
        ...prev,
        {
          id: newId,
          progress: 0
        }
      ]);
    }, 600);

    return () => clearInterval(mappingInterval);
  }, []);

  useEffect(() => {
    const mappingAnimation = setInterval(() => {
      setMappingFlows(prev => 
        prev
          .map(flow => ({ ...flow, progress: flow.progress + 2 }))
          .filter(flow => flow.progress <= 100)
      );
    }, 20);

    return () => clearInterval(mappingAnimation);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-100 overflow-hidden">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xl border-2 border-purple-200 rounded-2xl px-6 py-4 shadow-2xl shadow-purple-500/30">
          
          {/* left label */}
          <span className="text-purple-700 text-base font-bold tracking-wide">
            Overall Progress
          </span>

          {/* progress track with glow effect */}
          <div className="relative w-64 h-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full overflow-hidden shadow-inner">
            {/* Background shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            
            {/* Progress fill */}
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden shadow-lg"
              style={{ width: `${progressm.toFixed(5)}%` }}
            >
              {/* Animated shine effect on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
            </div>
          </div>

          {/* percentage badge with gradient background */}
          <div className="flex items-center gap-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl px-4 py-2 shadow-lg">
            <span className="text-white text-lg font-bold tabular-nums drop-shadow-md">
              {progressm.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <div className="relative w-full max-w-6xl h-[600px] px-8">
        
        {/* Source File - Right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400/40 blur-3xl rounded-full"></div>
            <div className="relative bg-white backdrop-blur-sm border-2 border-blue-400 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-blue-400">
                <FileText className="w-10 h-10 text-blue-400" strokeWidth={2} />
                <div>
                  <div className="text-blue-800 font-bold text-sm">ORIGIN FILES</div>
                  <div className="text-blue-600 text-xs font-mono font-semibold">data.json</div>
                </div>
              </div>
              
              <div className="space-y-4">
              {leftFiles.length > 0 ? leftFiles.map((file, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {/* Label above the box */}
                  <span className="text-xs text-blue-500 lowercase font-mono">{`file ${i + 1} name`}</span>
                  
                  {/* Box with actual file name */}
                  <div
                    className="bg-blue-50 border-2 border-blue-500 rounded px-3 py-2 text-cyan-800 text-xs font-mono flex items-center gap-2"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className="text-blue-600 font-bold"></span>
                    <span className="font-semibold truncate" title={file.name}>{file.name}</span>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-400 italic">No files</div>
              )}
            </div>

            </div>
          </div>
        </div>

        {/* Target File - Left */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-400/40 blur-3xl rounded-full"></div>
            <div className="relative bg-white backdrop-blur-sm border-2 border-purple-600 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-purple-600">
                <FileText className="w-10 h-10 text-purple-600" strokeWidth={2} />
                <div>
                  <div className="text-purple-800 font-bold text-sm">DESTINATION FILES</div>
                  <div className="text-purple-600 text-xs font-mono font-semibold">data.json</div>
                </div>
              </div>
              
              <div className="space-y-4">
              {rightFiles.length > 0 ? rightFiles.map((file, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {/* Label above the box */}
                  <span className="text-xs text-purple-500 lowercase font-mono">{`file ${i + 1} name`}</span>
                  
                  {/* Box with actual file name */}
                  <div
                    className="bg-blue-50 border-2 border-purple-500 rounded px-3 py-2 text-purple-800 text-xs font-mono flex items-center gap-2"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className="text-purple-600 font-bold"></span>
                    <span className="font-semibold truncate" title={file.name}>{file.name}</span>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-purple-400 italic">No files</div>
              )}
            </div>

            </div>
          </div>
        </div>

        {/* Status Messages - Above Engine */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ marginTop: "-220px" }}
        >
          <div className="backdrop-blur-sm px-6 py-3 min-w-[400px]">
            <div className="text-center text-white">
              <StatusMessages />
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 [perspective:800px]">
          <style>
            {`
              @keyframes rotateY {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
              }
              .animate-rotateY {
                animation: rotateY 3s linear infinite;
                transform-style: preserve-3d;
              }
            `}
          </style>

          <div className="relative mb-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <BrainCircuit
              className="w-16 h-16 text-purple-300 relative z-10 animate-rotateY"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* MAITRI AI Engine - Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex flex-col items-center justify-center text-center">
            
            {/* Outer glow effect */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent blur-3xl"></div>
            
            {/* Animated rings */}
            <div className="absolute left-1/2 top-25 -translate-x-1/2 w-40 h-40">
              <div
                className="absolute inset-0 border-2 border-blue-400/30 rounded-full animate-spin"
                style={{ animationDuration: "8s" }}
              ></div>
              <div
                className="absolute inset-4 border-2 border-purple-400/40 rounded-full animate-spin bg-white"
                style={{ animationDuration: "6s", animationDirection: "reverse" }}
              ></div>
            </div>

          
          <div className='flex flex-col gap-0'>
            <div className="w-20 h-20 relative z-10 flex items-center justify-center">
                <img
                  src="logo2.png"
                  alt="MAITRI Logo"
                  className="w-full h-full object-contain drop-shadow-2xl"
                  style={{ backgroundColor: "transparent" }}
                />
              </div>
          <div className="text-center z-10 ">
                <h5 className="text-purple-500 font-bold text-sm tracking-wider drop-shadow-lg">
                  MAITRI AI
                </h5>
              </div>
          </div>


          </div>
        </div>

        {/* Animated Data Flow - Inputs */}
        {dataPoints.map(point => {
          const startX = point.fromSource ? 20 : 80;
          const endX = 50;
          const currentX = startX + (endX - startX) * (point.progress / 100);
          
          return (
            <div
              key={point.id}
              className="absolute top-1/2 w-4 h-4 rounded-full shadow-lg transition-all"
              style={{
                left: `${currentX}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: point.fromSource ? 'rgba(34, 67, 215, 1)' : 'rgba(194, 39, 205, 1)',
                boxShadow: point.fromSource 
                  ? '0 0 20px rgba(8, 145, 178, 1)' 
                  : '0 0 20px rgba(5, 150, 105, 1)',
                opacity: 1 - (point.progress / 150),
                marginTop: `${Math.sin(point.progress * 0.1) * 20}px`,
                border: '2px solid white'
              }}
            />
          );
        })}

        {/* Mapping Flow - From Engine to Mapping Box */}
        {mappingFlows.map(flow => {
          const startY = 50;
          const endY = 68;
          const currentY = startY + (endY - startY) * (flow.progress / 100);
          
          return (
            <div
              key={flow.id}
              className="absolute left-1/2 w-4 h-4 rounded-full shadow-lg transition-all"
              style={{
                top: `${currentY}%`,
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(239, 121, 244, 1)',
                boxShadow: '0 0 20px rgba(147, 51, 234, 1)',
                opacity: 1 - (flow.progress / 120),
                border: '2px solid white'
              }}
            />
          );
        })}

        {/* Mapping Output - Below Engine */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 translate-y-32">
          <div className="bg-white backdrop-blur-sm border-2 border-green-600 rounded-lg px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <FileCheck className="w-5 h-5 text-green-600" strokeWidth={2} />
              <span className="text-green-800 text-sm font-mono font-bold">Mapping</span>
            </div>
            <div className="space-y-1.5">
              {[...Array(3)].map((_, i) => {
                const pattern = '*'.repeat(10 + (i * 3));
                return (
                  <div 
                    key={i}
                    className="flex items-center gap-2 text-green-700 text-xs font-mono animate-pulse font-semibold"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <span className="text-green-600 font-bold">→</span>
                    <span>{pattern}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Blinking Line from Engine to Mapping */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2" style={{ marginTop: '96px', height: '32px' }}>
          <div className="w-2 h-full mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-b animate-pulse rounded-full shadow-sm" 
                 style={{ boxShadow: '0 0 30px rgba(51, 234, 85, 1)' }}>
            </div>
          </div>
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="sourceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgb(8, 145, 178)', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(147, 51, 234)', stopOpacity: 0.6 }} />
            </linearGradient>
            <linearGradient id="targetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgb(147, 51, 234)', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(5, 150, 105)', stopOpacity: 0.8 }} />
            </linearGradient>
            <linearGradient id="mappingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 1 }}>
                <animate attributeName="stop-color" values="rgb(59, 130, 246); rgb(5, 150, 105); rgb(59, 130, 246)" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" style={{ stopColor: 'rgb(5, 150, 105)', stopOpacity: 1 }}>
                <animate attributeName="stop-color" values="rgb(5, 150, 105); rgb(59, 130, 246); rgb(5, 150, 105)" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          
          <line x1="20%" y1="50%" x2="50%" y2="50%" stroke="url(#sourceGrad)" strokeWidth="3" opacity="0.7" />
          <line x1="50%" y1="50%" x2="80%" y2="50%" stroke="url(#targetGrad)" strokeWidth="3" opacity="0.7" />
          <line x1="50%" y1="52%" x2="50%" y2="63%" stroke="url(#mappingGrad)" strokeWidth="4" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1s" repeatCount="indefinite" />
          </line>
        </svg>

        {/* Status Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white backdrop-blur-sm border-2 border-grren-600 rounded-full px-6 py-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 text-sm font-mono font-bold">PROCESSING</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoadingAnimation;