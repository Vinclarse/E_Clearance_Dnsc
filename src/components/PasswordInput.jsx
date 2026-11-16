import { useState } from "react";
import eyeIcon from "../assets/eye.png";
import "./PasswordInput.css";

export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  required = false,
  minLength,
  className = "",
  placeholder,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        id={id}
        className={className}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
      />
      <button
        className="password-visibility-toggle"
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <img src={eyeIcon} alt="" />
        {!visible && <span className="password-eye-slash" aria-hidden="true" />}
      </button>
    </div>
  );
}
