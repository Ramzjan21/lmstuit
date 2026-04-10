import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="cyber-loading-screen">
      {/* Animated Grid Background */}
      <div className="cyber-grid" />
      
      {/* Glowing Orbs */}
      <div className="cyber-orb cyber-orb-1" />
      <div className="cyber-orb cyber-orb-2" />
      <div className="cyber-orb cyber-orb-3" />
      
      {/* Central Hexagon */}
      <div className="cyber-hexagon-container">
        <div className="cyber-hexagon cyber-hex-1" />
        <div className="cyber-hexagon cyber-hex-2" />
        <div className="cyber-hexagon cyber-hex-3" />
        
        {/* Inner Circle */}
        <div className="cyber-circle">
          <div className="cyber-circle-inner" />
        </div>
      </div>
      
      {/* Rotating Rings */}
      <div className="cyber-rings">
        <div className="cyber-ring cyber-ring-1" />
        <div className="cyber-ring cyber-ring-2" />
        <div className="cyber-ring cyber-ring-3" />
      </div>
      
      {/* Scanning Lines */}
      <div className="cyber-scan-line cyber-scan-1" />
      <div className="cyber-scan-line cyber-scan-2" />
      
      {/* Particles */}
      <div className="cyber-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="cyber-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }} />
        ))}
      </div>

      <style>{`
        .cyber-loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          z-index: 9999;
        }

        /* Animated Grid */
        .cyber-grid {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 209, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 209, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
          opacity: 0.3;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        /* Glowing Orbs */
        .cyber-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
          animation: orbFloat 8s ease-in-out infinite;
        }

        .cyber-orb-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #00d1ff 0%, transparent 70%);
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .cyber-orb-2 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, #6366f1 0%, transparent 70%);
          bottom: 15%;
          right: 15%;
          animation-delay: 2s;
        }

        .cyber-orb-3 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, #ec4899 0%, transparent 70%);
          top: 50%;
          right: 20%;
          animation-delay: 4s;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }

        /* Hexagon Container */
        .cyber-hexagon-container {
          position: relative;
          width: 200px;
          height: 200px;
          z-index: 10;
        }

        .cyber-hexagon {
          position: absolute;
          width: 100%;
          height: 100%;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          border: 2px solid;
          animation: hexRotate 6s linear infinite;
        }

        .cyber-hex-1 {
          border-color: rgba(0, 209, 255, 0.6);
          animation-delay: 0s;
        }

        .cyber-hex-2 {
          border-color: rgba(99, 102, 241, 0.6);
          animation-delay: 2s;
          transform: scale(0.8);
        }

        .cyber-hex-3 {
          border-color: rgba(236, 72, 153, 0.6);
          animation-delay: 4s;
          transform: scale(0.6);
        }

        @keyframes hexRotate {
          0% { transform: rotate(0deg) scale(1); opacity: 1; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 0.5; }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }

        /* Inner Circle */
        .cyber-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid rgba(0, 209, 255, 0.8);
          box-shadow: 
            0 0 20px rgba(0, 209, 255, 0.5),
            inset 0 0 20px rgba(0, 209, 255, 0.3);
          animation: circlePulse 2s ease-in-out infinite;
        }

        .cyber-circle-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: radial-gradient(circle, #00d1ff 0%, transparent 70%);
          animation: innerGlow 1.5s ease-in-out infinite;
        }

        @keyframes circlePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        @keyframes innerGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* Rotating Rings */
        .cyber-rings {
          position: absolute;
          width: 300px;
          height: 300px;
        }

        .cyber-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border: 1px solid;
          opacity: 0.4;
        }

        .cyber-ring-1 {
          width: 300px;
          height: 300px;
          margin: -150px 0 0 -150px;
          border-color: #00d1ff;
          animation: ringRotate 8s linear infinite;
        }

        .cyber-ring-2 {
          width: 240px;
          height: 240px;
          margin: -120px 0 0 -120px;
          border-color: #6366f1;
          animation: ringRotate 6s linear infinite reverse;
        }

        .cyber-ring-3 {
          width: 180px;
          height: 180px;
          margin: -90px 0 0 -90px;
          border-color: #ec4899;
          animation: ringRotate 4s linear infinite;
        }

        @keyframes ringRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Scanning Lines */
        .cyber-scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(0, 209, 255, 0.8) 50%, 
            transparent 100%);
          box-shadow: 0 0 10px rgba(0, 209, 255, 0.8);
        }

        .cyber-scan-1 {
          top: 30%;
          animation: scanMove 3s ease-in-out infinite;
        }

        .cyber-scan-2 {
          bottom: 30%;
          animation: scanMove 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }

        @keyframes scanMove {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(100px); opacity: 1; }
        }

        /* Particles */
        .cyber-particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .cyber-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #00d1ff;
          border-radius: 50%;
          box-shadow: 0 0 10px #00d1ff;
          animation: particleFloat linear infinite;
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(100px);
            opacity: 0;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cyber-hexagon-container {
            width: 150px;
            height: 150px;
          }
          
          .cyber-rings {
            width: 250px;
            height: 250px;
          }
          
          .cyber-ring-1 {
            width: 250px;
            height: 250px;
            margin: -125px 0 0 -125px;
          }
          
          .cyber-ring-2 {
            width: 200px;
            height: 200px;
            margin: -100px 0 0 -100px;
          }
          
          .cyber-ring-3 {
            width: 150px;
            height: 150px;
            margin: -75px 0 0 -75px;
          }
        }
      `}</style>
    </div>
  );
}
