import React, { useEffect, useRef } from "react";

const GoldenAurora: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "rgba(255,215,0,0.15)"); // gold
      gradient.addColorStop(1, "rgba(255,165,0,0.05)"); // orange-golden

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,215,0,0.6)";
      ctx.lineWidth = 2;
      const time = Date.now() * 0.002;

      for (let x = 0; x < canvas.width; x += 20) {
        const y = canvas.height / 2 + Math.sin(x * 0.01 + time) * 50;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      requestAnimationFrame(animate);
    }
    animate();

    return () => {};
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
};

export default GoldenAurora;