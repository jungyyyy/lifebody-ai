export function StepTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-300 mb-1.5"
    >
      {children}
    </label>
  );
}

export function TextInput({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2.5 text-white placeholder:text-gray-500"
    />
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2.5 text-white"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-card">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-white/10 bg-background px-4 py-2.5 text-white placeholder:text-gray-500 resize-none"
    />
  );
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
            value === opt
              ? "border-accent bg-accent/10"
              : "border-white/10 hover:border-white/20"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="h-4 w-4 accent-accent"
          />
          <span className="text-sm text-gray-200">{opt}</span>
        </label>
      ))}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg bg-accent py-3 font-medium text-black transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg border border-white/20 py-3 font-medium text-gray-200 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      {message}
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
    </span>
  );
}
