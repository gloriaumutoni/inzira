interface Props {
  label?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helper?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const Input = ({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  helper,
  disabled = false,
  required = false,
  className = "",
}: Props) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-primary">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={`
        w-full rounded-button border px-3 py-2 text-sm text-primary
        placeholder:text-text-muted bg-surface
        transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-50
        ${error ? "border-red-400 focus:ring-red-400" : "border-border"}
      `}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
    {helper && !error && (
      <p className="text-xs text-text-secondary">{helper}</p>
    )}
  </div>
);

export default Input;
