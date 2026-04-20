"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, X } from "lucide-react";
import { Modal } from "./Modal";
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

  const min = minDate || new Date();
  const selected = value ? new Date(value + "T12:00:00") : undefined;

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
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

  function handleSelect(day: Date | undefined) {
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
    <>
      <div className="secdatepicker">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="DD/MM/YYYY"
          disabled={disabled}
          className="secdatepicker__input"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="secdatepicker__trigger"
          aria-label="Abrir calendario"
        >
          <Calendar size={18} />
        </button>
      </div>

      {dayLabel && <p className="secdatepicker__hint">Vence {dayLabel}</p>}

      <Modal open={open} onClose={() => setOpen(false)} size="sm">
        <div className="datepicker-modal">
          <header className="datepicker-modal__header">
            <h3>Selecciona una fecha</h3>
            <button
              onClick={() => setOpen(false)}
              className="btn-ghost btn-sm"
            >
              <X size={18} />
            </button>
          </header>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
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
      </Modal>
    </>
  );
}
