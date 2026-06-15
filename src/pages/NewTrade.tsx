import { useState, useEffect } from "react";
import { usePageTransition } from "../hooks/usePageTransition";
import { popRoute } from "../navigationMemory";
import type { ChangeEvent, ClipboardEvent, CSSProperties } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import {
  getTodayInputValue,
  tradeDateToIso,
} from "../utils/dateUtils";

type ScreenshotType = "before" | "after";

function NewTrade() {
  
  const animateIn = usePageTransition();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resultFocused, setResultFocused] = useState(false);
  const [backHovered, setBackHovered] = useState(false);

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
const [isSaving, setIsSaving] = useState(false);

useEffect(() => {
  window.scrollTo(0, 0);
}, []);

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

  setIsSaving(true);

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

  try {
    if (isEditMode) {
      const { error } = await supabase
        .from("trades")
        .update(payload)
        .eq("id", editId);

      if (error) {
        console.error(error);
        alert("Error updating trade");
        setIsSaving(false);
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
        setIsSaving(false);
        return;
      }
    }

    navigate("/history");
  } finally {
    setIsSaving(false);
  }
};

  const canSave = result.trim() !== "" && !Number.isNaN(Number(result.replace(",", ".")));

  return (
    <main
  style={{
    ...pageStyle,
    opacity: animateIn ? 1 : 0,
    transform: animateIn ? "translateY(0)" : "translateY(12px)",
    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  }}
>
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
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
          style={{
            ...quietButtonStyle,
            borderColor: backHovered ? colors.borderStrong : colors.border,
            background: backHovered ? colors.panelSoft : colors.panel,
          }}
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
          onFocus={() => setResultFocused(true)}
          onBlur={() => setResultFocused(false)}
          style={{
            ...inputStyle,
            marginBottom: 0,
            fontSize: "36px",
            fontWeight: 900,
            lineHeight: 1,
            textAlign: "center",
            borderColor: resultFocused ? colors.text : colors.border,
            background: resultFocused ? colors.panelSoft : colors.panel,
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
          disabled={!canSave || isSaving}
          style={{
            ...primaryButtonStyle,
            opacity: canSave && !isSaving ? 1 : 0.45,
            cursor: canSave && !isSaving ? "pointer" : "not-allowed",
          }}
          onClick={saveTrade}
        >
          {isSaving ? "SAVING..." : isEditMode ? "SAVE CHANGES" : "SAVE TRADE"}
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
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <section
      tabIndex={0}
      onPaste={onPaste}
      onClick={(e) => e.currentTarget.focus()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const event = {
              target: { files: [file] },
            } as unknown as ChangeEvent<HTMLInputElement>;
            onFileChange(event);
          };
          reader.readAsDataURL(file);
        }
      }}
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
          border: `1px dashed ${isDragOver ? colors.text : colors.borderStrong}`,
          borderRadius: radii.md,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: isDragOver ? colors.panelSoft : colors.bg,
          transition: "all 0.2s ease",
        }}
      >
        {image ? (
          <img src={image} alt="" style={previewStyle} />
        ) : (
          <div
            style={{
              color: colors.faint,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textAlign: "center",
              padding: "16px",
            }}
          >
            {isDragOver ? "DROP IMAGE HERE" : "PASTE OR DRAG IMAGE"}
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
export default NewTrade;
