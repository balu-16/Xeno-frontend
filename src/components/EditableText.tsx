import { Check, X, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

export function EditableText({
  value,
  onSave,
  className = "",
  inputClassName = "",
  placeholder = "Enter value",
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraft(value);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          onBlur={save}
          placeholder={placeholder}
          className={`h-7 px-2 rounded border border-indigo-300 text-sm outline-none ${inputClassName}`}
        />
        <button
          onClick={save}
          className="h-6 w-6 rounded grid place-items-center text-emerald-600 hover:bg-emerald-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={cancel}
          className="h-6 w-6 rounded grid place-items-center text-slate-400 hover:bg-slate-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group flex items-center gap-1.5 text-left ${className}`}
    >
      <span>{value}</span>
      <Pencil className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
