import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import type { Container, Engine } from "tsparticles-engine";
import { loadFull } from "tsparticles";

const OFF_WHITE_AMBER = "#fff7ed"; // background color — change if needed

const options = {
  fullScreen: false, // we'll place the component in our own container
  detectRetina: true,
  fpsLimit: 60,
  particles: {
    number: {
      value: 100,
      density: {
        enable: true,
        area: 800
      }
    },
    color: {
      value: "#80D8FF" // same as your snippet
    },
    shape: {
      type: "circle"
    },
    opacity: {
      value: 0.95,
      random: false,
      anim: {
        enable: true,
        speed: 0.6,
        opacity_min: 0.2,
        sync: false
      }
    },
    size: {
      value: { min: 2, max: 5 },
      random: true
    },
    links: {
      enable: true,
      distance: 180,
      opacity: 0.25,
      width: 1,
      color: "#80D8FF"
    },
    move: {
      enable: true,
      speed: 0.9,
      direction: "none",
      random: false,
      straight: false,
      outModes: {
        default: "out"
      },
      attract: {
        enable: false
      }
    }
  },
  interactivity: {
    detectsOn: "canvas",
    events: {
      onHover: {
        enable: true,
        mode: "repulse"
      },
      onClick: {
        enable: true,
        mode: "push"
      },
      resize: true
    },
    modes: {
      grab: { distance: 400, links: { opacity: 0.6 } },
      bubble: { distance: 400, size: 8, duration: 2, opacity: 0.8 },
      repulse: { distance: 120 },
      push: { quantity: 4 },
      remove: { quantity: 2 }
    }
  },
  background: {
    color: OFF_WHITE_AMBER
  }
};

const ParticlesBackground: React.FC = () => {
  // load tsparticles engine
  const particlesInit = useCallback(async (engine: Engine) => {
    // this loads the tsparticles bundle with all features
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    // optional: you can keep a ref to container for debugging
    // console.log("Particles container loaded:", container);
  }, []);

  // The outer wrapper ensures the chat UI can be placed above
  // Put this component as a sibling behind your chat UI and ensure chat UI has higher z-index.
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        background: OFF_WHITE_AMBER, // ensures background color always visible behind canvas
        pointerEvents: "none" // let clicks pass through to UI by default (particles still respond via particle canvas)
      }}
    >
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={options}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          // keep canvas visually subtle so text on top remains readable
          opacity: 1,
          pointerEvents: "auto" // set to "auto" if you want hover/click interactivity; else "none"
        }}
      />
    </div>
  );
};

export default ParticlesBackground;