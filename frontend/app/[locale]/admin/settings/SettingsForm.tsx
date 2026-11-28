"use client";

import { useState, type FormEvent } from "react";

type SettingsFormProps = {
  initialName: string;
};

const fieldClassName =
  "mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600";

export function SettingsForm({ initialName }: SettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(
      "Settings are not connected to an API yet. No changes have been saved.",
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="account-name" className="text-sm font-medium text-slate-800">
          Name
        </label>
        <input
          id="account-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClassName}
        />
      </div>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-900">
          Change password
        </legend>
        <div>
          <label
            htmlFor="current-password"
            className="text-sm font-medium text-slate-800"
          >
            Current password
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className={fieldClassName}
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="text-sm font-medium text-slate-800"
          >
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            className={fieldClassName}
          />
        </div>
      </fieldset>

      <div className="space-y-3">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Save settings
        </button>
        {notice && (
          <p role="status" className="text-sm text-amber-800">
            {notice}
          </p>
        )}
      </div>
    </form>
  );
}
