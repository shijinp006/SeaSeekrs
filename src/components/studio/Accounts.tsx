"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { send } from "@/lib/studio/client";
import { Badge, CARD, DANGER, GOLD, INPUT, LINE, Modal, Note } from "./ui";

type Role = "ADMIN" | "SEO";
type Account = { id: string; name: string; email: string; role: Role; active: boolean; lastLogin: string | null };

function Input({ label, error, hint, ...props }: { label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.875rem] font-medium">{label}</span>
      <input {...props} aria-invalid={!!error} className={INPUT} />
      {(error || hint) && <span className={`mt-1.5 block text-[0.8125rem] ${error ? "text-[#a52a2a]" : "text-(--mute)"}`}>{error ?? hint}</span>}
    </label>
  );
}

/** Sends the fields of a form; shows what the server says about each */
function useForm(method: string, url: string, onDone: () => void) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    const r = await send(method, url, Object.fromEntries(new FormData(form)));
    setBusy(false);
    setErrors(r.ok ? {} : (r.fields ?? {}));
    setError(r.ok ? "" : r.error);
    if (r.ok) {
      form.reset();
      onDone();
    }
  };
  return { errors, error, busy, submit };
}

export function LoginForm({ next }: { next: string }) {
  const f = useForm("POST", "/api/studio/auth/login", () => window.location.assign(next));
  return (
    <form onSubmit={f.submit} className="space-y-5">
      <Input label="Email" name="email" type="email" autoComplete="username" required autoFocus error={f.errors.email} />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required error={f.errors.password} />
      <button type="submit" className={`${GOLD} w-full py-3`} disabled={f.busy}>
        {f.busy ? "Signing in…" : "Sign in"}
      </button>
      <Note text={f.error} bad />
    </form>
  );
}

export function PasswordForm() {
  const [done, setDone] = useState(false);
  const f = useForm("PUT", "/api/studio/account/password", () => setDone(true));
  return (
    <form onSubmit={f.submit} className={`${CARD} max-w-lg space-y-5 p-5 sm:p-7`}>
      <Input label="Current password" name="current" type="password" autoComplete="current-password" required error={f.errors.current} />
      <Input label="New password" name="password" type="password" autoComplete="new-password" required error={f.errors.password} hint="12 characters or more" />
      <button type="submit" className={GOLD} disabled={f.busy}>
        Change password
      </button>
      <Note text={f.error || (done ? "Changed. Other browsers were signed out." : "")} bad={!!f.error} />
    </form>
  );
}

const roleSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={INPUT}>
    <option value="SEO">SEO specialist</option>
    <option value="ADMIN">Admin</option>
  </select>
);

function NewUser({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const f = useForm("POST", "/api/studio/users", () => {
    onClose();
    router.refresh();
  });
  return (
    <Modal title="Add a user" onClose={onClose}>
      <form onSubmit={f.submit} className="space-y-5">
        <Input label="Name" name="name" required error={f.errors.name} />
        <Input label="Email" name="email" type="email" required error={f.errors.email} />
        <label className="block">
          <span className="mb-1.5 block text-[0.875rem] font-medium">Role</span>
          {roleSelect({ name: "role", defaultValue: "SEO" })}
        </label>
        <Input label="Password" name="password" type="password" autoComplete="new-password" required error={f.errors.password} hint="12 characters or more" />
        <button type="submit" className={GOLD} disabled={f.busy}>
          Add user
        </button>
        <Note text={f.error} bad />
      </form>
    </Modal>
  );
}

function NewPassword({ account, onClose }: { account: Account; onClose: () => void }) {
  const f = useForm("PATCH", `/api/studio/users/${account.id}`, onClose);
  return (
    <Modal title={`New password for ${account.name}`} onClose={onClose}>
      <form onSubmit={f.submit} className="space-y-5">
        <Input label="New password" name="password" type="password" autoComplete="new-password" required error={f.errors.password} hint="12 characters or more. Signs this user out everywhere." />
        <button type="submit" className={GOLD} disabled={f.busy}>
          Set password
        </button>
        <Note text={f.error} bad />
      </form>
    </Modal>
  );
}

export function UserList({ accounts, me }: { accounts: Account[]; me: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<Account | null>(null);
  const [error, setError] = useState("");

  const run = async (method: string, id: string, data?: unknown) => {
    const r = await send(method, `/api/studio/users/${id}`, data);
    setError(r.ok ? "" : r.error);
    if (r.ok) router.refresh();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className={GOLD} onClick={() => setAdding(true)}>
          Add a user
        </button>
        <Note text={error} bad />
      </div>
      <ul className={`${CARD} mt-5 divide-y divide-(--rule)`}>
        {accounts.map((a) => (
          <li key={a.id} className="grid items-center gap-x-6 gap-y-3 p-5 lg:grid-cols-[minmax(0,1fr)_11rem_auto]">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[0.9375rem] font-medium">
                {a.name}
                {a.id === me && <Badge tone="calm">You</Badge>}
                {!a.active && <Badge tone="warn">Turned off</Badge>}
              </p>
              <p className="truncate text-[0.875rem] text-(--mute)">
                {a.email}. {a.lastLogin ? `Last signed in ${a.lastLogin}` : "Never signed in"}
              </p>
            </div>
            {roleSelect({
              "aria-label": `Role of ${a.name}`,
              value: a.role,
              disabled: a.id === me,
              onChange: (e) => run("PATCH", a.id, { role: e.target.value }),
            })}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={LINE} onClick={() => setResetting(a)}>
                New password
              </button>
              {a.id !== me && (
                <>
                  <button type="button" className={LINE} onClick={() => run("PATCH", a.id, { active: !a.active })}>
                    {a.active ? "Turn off" : "Turn on"}
                  </button>
                  <button
                    type="button"
                    className={DANGER}
                    onClick={() => window.confirm(`Delete the account of ${a.name}? This cannot be undone.`) && run("DELETE", a.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {adding && <NewUser onClose={() => setAdding(false)} />}
      {resetting && <NewPassword account={resetting} onClose={() => setResetting(null)} />}
    </>
  );
}
