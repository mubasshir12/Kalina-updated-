import React, { useEffect, useRef } from "react";

const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function draw() {
      const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grd.addColorStop(0, "rgba(0,255,255,0.3)");
      grd.addColorStop(1, "rgba(255,0,255,0.3)");

      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function animate() {
      draw();
      requestAnimationFrame(animate);
    }
    animate();
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

export default AuroraBackground;