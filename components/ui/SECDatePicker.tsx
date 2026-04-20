"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";
import "react-day-picker/style.css";

interface SECDatePickerProps {
  value: string;
  onChange: (dateStr: string) => void;
  minDate?: Date;
  disabled?: boolean;
}

export function SECDatePicker({
  value,
  onChange,
  minDate,
  disabled,
}: SECDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const ref = useRef<HTMLDivElement>(null);

  const min = minDate || new Date();
  const selected = value ? new Date(value + "T12:00:00") : undefined;

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);

    // Try parsing DD/MM/YYYY or YYYY-MM-DD
    const parsed = parse(v, "dd/MM/yyyy", new Date());
    if (isValid(parsed) && parsed >= min) {
      onChange(format(parsed, "yyyy-MM-dd"));
    } else {
      const parsed2 = parse(v, "yyyy-MM-dd", new Date());
      if (isValid(parsed2) && parsed2 >= min) {
        onChange(format(parsed2, "yyyy-MM-dd"));
      }
    }
  }

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const dateStr = format(day, "yyyy-MM-dd");
    onChange(dateStr);
    setInputValue(dateStr);
    setOpen(false);
  }

  const dayLabel = selected
    ? format(selected, "EEEE d 'de' MMMM", { locale: es })
    : null;

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="DD/MM/YYYY"
          disabled={disabled}
          className="flex-1 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--bg-muted)",
          }}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={disabled}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition"
          style={{
            backgroundColor: "var(--bg-muted)",
            color: "var(--text-muted)",
          }}
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {dayLabel && (
        <p
          className="text-[10px] mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          Vence {dayLabel}
        </p>
      )}

      {open && (
        <div
          className="absolute z-50 mt-1 rounded-xl shadow-lg p-3"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--bg-muted)",
          }}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            locale={es}
            weekStartsOn={1}
            disabled={{ before: min }}
            modifiersStyles={{
              selected: {
                backgroundColor: "var(--accent-primary)",
                color: "#fff",
              },
              today: {
                color: "var(--urgent)",
                fontWeight: 600,
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
