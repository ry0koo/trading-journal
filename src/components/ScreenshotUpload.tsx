import React, { useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent } from "react";
import { Card, Button } from "./PremiumUI";

interface ScreenshotUploadProps {
  title: string;
  image: string;
  onClear: () => void;
  onFileChange: (file: File) => void;
}

export const ScreenshotUpload: React.FC<ScreenshotUploadProps> = ({
  title,
  image,
  onClear,
  onFileChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image")
    );
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    e.preventDefault();
    onFileChange(file);
  };

  const onInternalFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange(file);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image")) {
      onFileChange(file);
    }
  };

  return (
    <Card
      tabIndex={0}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      style={{
        padding: "16px",
        background: isDragOver ? "var(--panel-soft)" : "var(--panel)",
        border: isDragOver ? "1px solid var(--text)" : "1px solid var(--border)",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 style={{ fontSize: "11px", fontWeight: 800, color: "var(--muted)", letterSpacing: "0.1em" }}>
          {title.toUpperCase()}
        </h3>
        {image && (
          <Button variant="danger" size="sm" onClick={onClear}>
            REMOVE
          </Button>
        )}
      </div>

      <div
        style={{
          minHeight: "140px",
          border: image ? "1px solid var(--border)" : "2px dashed var(--border-strong)",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "var(--bg)",
          position: "relative",
          cursor: "pointer",
        }}
        onClick={() => document.getElementById(`file-input-${title}`)?.click()}
      >
        {image ? (
          <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "20px" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>📸</div>
            <div style={{ fontSize: "12px", fontWeight: 700 }}>
              {isDragOver ? "DROP TO UPLOAD" : "CLICK, PASTE OR DRAG"}
            </div>
          </div>
        )}
        <input
          id={`file-input-${title}`}
          type="file"
          accept="image/*"
          onChange={onInternalFileChange}
          style={{ display: "none" }}
        />
      </div>
    </Card>
  );
};
