import { useState } from "react";
import { popRoute } from "../navigationMemory";
import type { ChangeEvent, ClipboardEvent, CSSProperties } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  activeSegmentStyle,
  colors,
  headerStyle,
  inputStyle,
  labelStyle,
  pageStyle,
  primaryButtonStyle,
  quietButtonStyle,
  radii,
  sectionStyle,
  segmentStyle,
  segmentedRowStyle,
  selectStyle,
  titleStyle,
} from "../ui";

type ScreenshotType = "before" | "after";

function NewTrade() {
  
  const [animateIn, setAnimateIn] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setAnimateIn(true), 10);
  return () => clearTimeout(timer);
}, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

const editId = searchParams.get("edit");
const isEditMode = !!editId;

  const [instrument, setInstrument] = useState<"EURUSD" | "GBPUSD">("EURUSD");
  const [tradeDate, setTradeDate] = useState(getTodayInputValue());
  const [session, setSession] = useState("London");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [result, setResult] = useState("");
  const [comment, setComment] = useState("");
  const [beforeImage, setBeforeImage] = useState("");
  const [afterImage, setAfterImage] = useState("");
  useEffect(() => {
  if (!editId) return;

  const loadTrade = async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("id", editId)
      .single();

    if (error || !data) return;

    setInstrument(data.instrument);
    setDirection(data.direction);
    setSession(data.session || "");
    setTradeDate(data.trade_date || getTodayInputValue());
    setResult(String(data.result));
    setComment(data.comment || "");
    setBeforeImage(data.before_image || "");
    setAfterImage(data.after_image || "");
    useEffect(() => {
  window.scrollTo(0, 0);
}, []);
  };

  loadTrade();
}, [editId]);

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
    e: ChangeEvent<HTMLInputElement>,
    type: ScreenshotType
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    readFileToDataUrl(file, type);
    e.target.value = "";
  };

  const handlePaste = (
    e: ClipboardEvent<HTMLDivElement>,
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

  const payload = {
    instrument,
    direction,
    result: Number(result.replace(",", ".")),
    session,
    trade_date: tradeDate,
    comment,
    before_image: beforeImage,
    after_image: afterImage,
  };

  if (isEditMode) {
    const { error } = await supabase
      .from("trades")
      .update(payload)
      .eq("id", editId);

    if (error) {
      console.error(error);
      alert("Error updating trade");
      return;
    }
  } else {
    const { error } = await supabase
      .from("trades")
      .insert([
        {
          ...payload,
          created_at: tradeDateToIso(tradeDate),
        },
      ]);

    if (error) {
      console.error(error);
      alert("Error saving trade");
      return;
    }
  }

  navigate("/history");
};

  const canSave = result.trim() !== "" && !Number.isNaN(Number(result.replace(",", ".")));

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <button
          type="button"
          onClick={() => {
  const prev = popRoute();

  if (prev) {
    navigate(prev);
  } else {
    navigate("/");
  }
}}
          style={quietButtonStyle}
        >
          BACK
        </button>
        <h1 style={titleStyle}>
  {isEditMode ? "EDIT TRADE" : "NEW TRADE"}
</h1>
      </header>

      <section style={{ ...sectionStyle, marginBottom: "14px" }}>
        <div style={twoColumnStyle}>
          <Field label="Instrument">
            <select
              value={instrument}
              onChange={(e) =>
                setInstrument(e.target.value as "EURUSD" | "GBPUSD")
              }
              style={selectStyle}
            >
              <option value="EURUSD">EURUSD</option>
              <option value="GBPUSD">GBPUSD</option>
            </select>
          </Field>

          <Field label="Trade Date">
            <input
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0 }}
            />
          </Field>
        </div>

        <Field label="Session">
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            style={selectStyle}
          >
            <option value="Tokyo">Tokyo</option>
            <option value="London">London</option>
            <option value="New York">New York</option>
            <option value="Out of session">Out of session</option>
          </select>
        </Field>

        <label style={labelStyle}>Direction</label>
        <div style={segmentedRowStyle}>
          <button
            type="button"
            style={direction === "LONG" ? activeSegmentStyle : segmentStyle}
            onClick={() => setDirection("LONG")}
          >
            LONG
          </button>

          <button
            type="button"
            style={direction === "SHORT" ? activeSegmentStyle : segmentStyle}
            onClick={() => setDirection("SHORT")}
          >
            SHORT
          </button>
        </div>

        <label style={labelStyle}>Result (R)</label>
        <input
          type="text"
          inputMode="decimal"
          step="0.1"
          placeholder="0.0"
          value={result}
          onChange={(e) => {
  const value = e.target.value.replace(",", ".");
  setResult(value);
}}
          style={{
            ...inputStyle,
            marginBottom: 0,
            fontSize: "36px",
            fontWeight: 900,
            lineHeight: 1,
            textAlign: "center",
          }}
        />
      </section>

      <section style={{ ...sectionStyle, marginBottom: "14px" }}>
        <label style={labelStyle}>Comment</label>
        <textarea
          placeholder="Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            ...inputStyle,
            height: "112px",
            marginBottom: 0,
            resize: "vertical",
          }}
        />
      </section>

      <div style={{ display: "grid", gap: "14px" }}>
        <ScreenshotBlock
          title="BEFORE"
          image={beforeImage}
          onPaste={(e) => handlePaste(e, "before")}
          onFileChange={(e) => handleFileChange(e, "before")}
        />

        <ScreenshotBlock
          title="AFTER"
          image={afterImage}
          onPaste={(e) => handlePaste(e, "after")}
          onFileChange={(e) => handleFileChange(e, "after")}
        />
      </div>

      <div
        style={{
          marginTop: "18px",
        }}
      >
        <button
          type="button"
          disabled={!canSave}
          style={{
            ...primaryButtonStyle,
            opacity: canSave ? 1 : 0.45,
            cursor: canSave ? "pointer" : "not-allowed",
          }}
          onClick={saveTrade}
        >
          {isEditMode ? "SAVE CHANGES" : "SAVE TRADE"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelStyle}>{label}</label>
      {children}
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
  onPaste: (e: ClipboardEvent<HTMLDivElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <section
      tabIndex={0}
      onPaste={onPaste}
      onClick={(e) => e.currentTarget.focus()}
      style={sectionStyle}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 900,
            letterSpacing: "0.08em",
          }}
        >
          {title}
        </h2>
      </div>

      <div
        style={{
          minHeight: "136px",
          border: `1px dashed ${colors.borderStrong}`,
          borderRadius: radii.md,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: colors.bg,
        }}
      >
        {image ? (
          <img src={image} alt="" style={previewStyle} />
        ) : (
          <div
            style={{
              color: colors.faint,
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.08em",
            }}
          >
            NO IMAGE
          </div>
        )}
      </div>

      <label
        style={{
          ...quietButtonStyle,
          display: "inline-flex",
          marginTop: "12px",
          fontSize: "12px",
          padding: "10px 12px",
        }}
      >
        CHOOSE FILE
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </label>
    </section>
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

const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const previewStyle: CSSProperties = {
  width: "100%",
  display: "block",
};
// temp fix
// temp fix
export default NewTrade;
