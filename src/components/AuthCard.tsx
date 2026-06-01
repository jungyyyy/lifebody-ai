import Link from "next/link";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-semibold text-white">
        <span aria-hidden>🌿</span>
        <span>LifeBody AI</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthInput({
  label,
  id,
  type = "text",
  value,
  onChange,
  required = true,
  autoComplete,
  placeholder,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-background px-4 py-2.5 text-white placeholder:text-gray-500 transition-colors"
      />
    </div>
  );
}

export function AuthButton({
  children,
  type = "submit",
  disabled = false,
}: {
  children: React.ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-lg bg-accent py-2.5 font-medium text-black transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function AuthMessage({
  type,
  children,
}: {
  type: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg px-4 py-3 text-sm ${
        type === "success"
          ? "bg-accent/10 text-accent border border-accent/20"
          : "bg-red-500/10 text-red-400 border border-red-500/20"
      }`}
    >
      {children}
    </div>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-accent hover:text-accent-hover transition-colors">
      {children}
    </Link>
  );
}
