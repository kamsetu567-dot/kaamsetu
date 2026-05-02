"use client";

import { useRef } from "react";

export default function OTPInput({ value = "", onChange, length = 6, disabled = false }) {
  const digits = value.split("").slice(0, length);
  while (digits.length < length) digits.push("");
  const refs = useRef([]);

  function handleChange(index, e) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = val;
    onChange(newDigits.join(""));
    if (val && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(text.padEnd(length, "").slice(0, length));
    refs.current[Math.min(text.length, length - 1)]?.focus();
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste} aria-label="OTP input">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-border-light rounded-xl focus:border-primary-orange focus:outline-none bg-white"
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
