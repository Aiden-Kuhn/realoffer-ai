"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { inputClasses } from "@/components/shared/Field";

/** A password input with its own independent show/hide toggle — self-contained
 * so any number of these can sit in the same form without sharing visibility
 * state. Takes the spread result of react-hook-form's `register(name)`
 * rather than `register` + a name, so it isn't tied to any one form's value
 * type. */
export function PasswordInput({
  id,
  autoComplete,
  registration,
}: {
  id: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder="••••••••"
        className={`${inputClasses} pr-11`}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-white/40 hover:text-white transition-colors"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
