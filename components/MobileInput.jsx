"use client";

export default function MobileInput({ value = "", onChange, error = "", disabled = false, placeholder = "मोबाइल नंबर" }) {
  function handleChange(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(val);
  }
  return (
    <div>
      <div
        className={`flex items-center border-2 rounded-xl overflow-hidden bg-white transition-colors ${
          error ? "border-red-400" : "border-border-light focus-within:border-primary-orange"
        }`}
      >
        <span className="px-4 py-4 bg-gray-50 border-r-2 border-border-light text-text-secondary font-semibold text-lg select-none">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={10}
          className="flex-1 px-4 py-4 text-lg focus:outline-none bg-transparent"
          aria-label="Mobile number"
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
