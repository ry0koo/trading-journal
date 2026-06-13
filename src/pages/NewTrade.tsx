import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type ScreenshotType = "before" | "after";

function NewTrade() {
  const navigate = useNavigate();

  const [instrument, setInstrument] = useState<"EURUSD" | "GBPUSD">("EURUSD");
  const [tradeDate, setTradeDate] = useState(getTodayInputValue());
  const [session, setSession] = useState("London");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [result, setResult] = useState("");
  const [comment, setComment] = useState("");

  const [beforeImage, setBeforeImage] = useState("");
  const [afterImage, setAfterImage] = useState("");

  const readFileToDataUrl = (file: File, type: ScreenshotType) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const image = reader.result as string;

      if (type === "before") {
        setBeforeImage(image);
      } else {
        setAfterImage(image);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: ScreenshotType
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    readFileToDataUrl(file, type);

    // Allows selecting the same file again if needed.
    e.target.value = "";
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLDivElement>,
    type: ScreenshotType
  ) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image"));

    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    e.preventDefault();
    readFileToDataUrl(file, type);
  };

  const saveTrade = async () => {
  if (!result.trim()) return;

  const { error } = await supabase
    .from("trades")
    .insert([
      {
        instrument,
        direction,
        result: Number(result),

        session,
        trade_date: tradeDate,

        comment,

        before_image: beforeImage,
        after_image: afterImage,

        created_at: tradeDateToIso(tradeDate),
      },
    ]);

  if (error) {
    console.error(error);
    alert("Error saving trade");
    return;
  }

  navigate("/history");
};

  const canSave = result.trim() !== "";

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        color: "#fff",
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "64px",
          marginBottom: "30px",
        }}
      >
        NEW TRADE
      </h1>

      <label style={labelStyle}>Instrument</label>
      <select
        value={instrument}
        onChange={(e) => setInstrument(e.target.value as "EURUSD" | "GBPUSD")}
        style={inputStyle}
      >
        <option value="EURUSD">EURUSD</option>
        <option value="GBPUSD">GBPUSD</option>
      </select>

      <label style={labelStyle}>Trade Date</label>
      <input
        type="date"
        value={tradeDate}
        onChange={(e) => setTradeDate(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Session</label>
      <select
        value={session}
        onChange={(e) => setSession(e.target.value)}
        style={inputStyle}
      >
        <option value="Tokyo">Tokyo</option>
        <option value="London">London</option>
        <option value="New York">New York</option>
        <option value="Out of session">Out of session</option>
      </select>

      <label style={labelStyle}>Direction</label>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          style={direction === "LONG" ? activeButton : button}
          onClick={() => setDirection("LONG")}
        >
          LONG
        </button>

        <button
          type="button"
          style={direction === "SHORT" ? activeButton : button}
          onClick={() => setDirection("SHORT")}
        >
          SHORT
        </button>
      </div>

      <label style={labelStyle}>Result (R)</label>
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        placeholder="Result (R)"
        value={result}
        onChange={(e) => setResult(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>Comment</label>
      <textarea
        placeholder="Comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{
          ...inputStyle,
          height: "120px",
          resize: "vertical",
        }}
      />

      <ScreenshotBlock
        title="BEFORE SCREENSHOT"
        image={beforeImage}
        onPaste={(e) => handlePaste(e, "before")}
        onFileChange={(e) => handleFileChange(e, "before")}
      />

      <ScreenshotBlock
        title="AFTER SCREENSHOT"
        image={afterImage}
        onPaste={(e) => handlePaste(e, "after")}
        onFileChange={(e) => handleFileChange(e, "after")}
      />

      <button
        type="button"
        disabled={!canSave}
        style={{
          ...saveButton,
          opacity: canSave ? 1 : 0.5,
          cursor: canSave ? "pointer" : "not-allowed",
        }}
        onClick={saveTrade}
      >
        SAVE TRADE
      </button>
    </div>
  );
}

function ScreenshotBlock({
  title,
  image,
  onPaste,
  onFileChange,
}: {
  title: string;
  image: string;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      tabIndex={0}
      onPaste={onPaste}
      onClick={(e) => e.currentTarget.focus()}
      style={uploadBlock}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "16px",
          textAlign: "center",
          fontSize: "18px",
          fontWeight: 800,
        }}
      >
        {title}
      </h3>

      <div style={pasteAreaStyle}>
        {image ? (
          <img
            src={image}
            alt=""
            style={previewStyle}
          />
        ) : (
          <div
            style={{
              textAlign: "center",
              opacity: 0.75,
              lineHeight: 1.6,
            }}
          >
            Click here and press <b>Ctrl + V</b>
            <br />
            or choose a file below
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{
          marginTop: "14px",
          color: "#fff",
          width: "100%",
        }}
      />
    </div>
  );
}

function getTodayInputValue() {
  const today = new Date();
  const offsetMs = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offsetMs).toISOString().slice(0, 10);
}

function tradeDateToIso(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  opacity: 0.75,
  letterSpacing: "0.5px",
};

const inputStyle = {
  width: "100%",
  padding: "18px",
  marginBottom: "16px",
  background: "#111",
  color: "#fff",
  border: "1px solid #222",
  borderRadius: "14px",
  fontSize: "16px",
  boxSizing: "border-box" as const,
};

const button = {
  flex: 1,
  padding: "18px",
  background: "#111",
  color: "#fff",
  border: "1px solid #222",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: 700,
};

const activeButton = {
  ...button,
  border: "1px solid #fff",
};

const uploadBlock = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
  outline: "none",
};

const pasteAreaStyle = {
  minHeight: "140px",
  border: "1px dashed #333",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
};

const previewStyle = {
  width: "100%",
  borderRadius: "12px",
  display: "block",
};

const saveButton = {
  width: "100%",
  padding: "20px",
  background: "#fff",
  color: "#000",
  border: "none",
  borderRadius: "16px",
  fontWeight: 800,
  fontSize: "16px",
  cursor: "pointer",
};

export default NewTrade;