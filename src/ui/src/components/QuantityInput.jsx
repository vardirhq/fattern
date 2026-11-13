export function QuantityInput({ value, onChange, min = 0, step = 0.01, placeholder = '0', ...props }) {
  return (
    <input
      type="number"
      step={step}
      min={min}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="ft-input mt-2 w-full r-lg px-4 py-2 text-sm"
      {...props}
    />
  );
}

