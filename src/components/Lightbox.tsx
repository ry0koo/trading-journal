import React from "react";

interface LightboxProps {
  image: { src: string; title: string };
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ image, onClose }) => {
  return (
    <div
      onClick={onClose}
      className="glass-morphism"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "100%", maxHeight: "100%" }}>
        <button
          type="button"
          onClick={onClose}
          className="btn-press"
          style={{
            position: "absolute",
            top: "-60px",
            right: 0,
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          ✕
        </button>
        <img
          src={image.src}
          alt={image.title}
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "85vh",
            objectFit: "contain",
            borderRadius: "24px",
            boxShadow: "var(--shadow-lg)",
          }}
        />
        <div
          style={{
            marginTop: "16px",
            textAlign: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "0.02em",
          }}
        >
          {image.title.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
