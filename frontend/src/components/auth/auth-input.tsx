"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icon, type IconName } from "@/components/ui/icons";

export function AuthInput({
  id,
  label,
  icon,
  hint,
  error,
  revealable = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: IconName;
  hint?: string;
  error?: string;
  revealable?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const type = revealable && revealed ? "text" : props.type;

  return (
    <div>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="auth-input-wrap">
        <Icon name={icon} size={18} className="auth-input-icon" />
        <input
          {...props}
          id={id}
          type={type}
          className="auth-input"
          placeholder={props.placeholder ?? label}
          aria-invalid={error ? true : undefined}
        />
        {revealable ? (
          <button
            type="button"
            className="auth-input-action"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            <Icon name={revealed ? "eyeOff" : "eye"} size={18} />
          </button>
        ) : null}
      </div>
      {hint ? <p className="field-hint">{hint}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
