// components/team/AddMemberModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { PermissionPicker } from "@/components/team/PermissionPicker";
import { Modal } from "@/components/ui/Modal";
import { btnNavy, btnOutline, inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { PermissionLevel, staffService } from "@/services/staff";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

type Mode = "create" | "invite";

interface Result {
  mode: Mode;
  email: string;
  emailSent: boolean;
  tempPassword?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void; // refresh the team and the invitations
}

export function AddMemberModal({ open, onClose, onDone }: AddMemberModalProps) {
  const [mode, setMode] = useState<Mode>("create");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState<PermissionLevel>("limited_access");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("create");
    setFirstName("");
    setLastName("");
    setEmail("");
    setDepartment("");
    setLevel("limited_access");
    setSaving(false);
    setError("");
    setResult(null);
    setCopied(false);
  }, [open]);

  const finish = () => {
    if (result) onDone();
    onClose();
  };

  const handleSubmit = async () => {
    if (saving) return;
    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL.test(cleanEmail)) return setError("Enter a valid email address.");
    if (mode === "create" && (!firstName.trim() || !lastName.trim())) return setError("Enter their first and last name.");

    setSaving(true);
    setError("");
    try {
      if (mode === "create") {
        const res = await staffService.createStaff({
          email: cleanEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          department: department.trim() || undefined,
          permissionLevel: level,
        });
        setResult({ mode, email: res.staff?.email ?? cleanEmail, emailSent: res.emailSent, tempPassword: res.tempPassword });
      } else {
        // The backend accepts an access level on invitations but drops it, so it is set after they accept.
        const res = await staffService.invite({ email: cleanEmail });
        setResult({ mode, email: res.email ?? cleanEmail, emailSent: res.emailSent });
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not add this member. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const copyPassword = async () => {
    if (!result?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
    } catch {
      setError("Could not copy. Select the password and copy it by hand.");
    }
  };

  const tab = (key: Mode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === key}
      onClick={() => { setMode(key); setError(""); }}
      disabled={saving}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        mode === key ? "bg-white text-primary shadow" : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal
      open={open}
      title={result ? "Member added" : "Add team member"}
      subtitle={result ? undefined : "Create their account now, or email them an invitation."}
      onClose={finish}
      busy={saving}
      footer={
        result ? (
          <div className="flex justify-end">
            <button type="button" onClick={finish} className={btnNavy}>
              Done
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className={btnOutline}>
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving} className={btnNavy}>
              {saving ? "Saving..." : mode === "create" ? "Create account" : "Send invitation"}
            </button>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          {result.mode === "create" && result.emailSent && (
            <p className="text-body-md text-on-surface">
              {result.email} will receive their sign in details by email. They choose their own passcode the first time they sign in.
            </p>
          )}

          {result.mode === "create" && !result.emailSent && (
            <>
              <p className="text-body-md text-on-surface">
                The account was created, but the email could not be sent. Give {result.email} this temporary password yourself. It is shown only once.
              </p>
              {result.tempPassword ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <span className="text-2xl font-extrabold tracking-[0.2em] text-primary">{result.tempPassword}</span>
                  <button type="button" onClick={copyPassword} className={btnOutline}>
                    <Icon name={copied ? "check" : "content_copy"} size={16} /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : (
                <p className="text-body-md text-error">No temporary password was returned. Reset it from the account if they cannot sign in.</p>
              )}
            </>
          )}

          {result.mode === "invite" && result.emailSent && (
            <p className="text-body-md text-on-surface">
              Invitation sent to {result.email}. It stays under Pending invitations until they accept. Set their access level after they join.
            </p>
          )}

          {result.mode === "invite" && !result.emailSent && (
            <p className="text-body-md text-on-surface">
              The invitation was saved, but the email could not be sent. Use Resend under Pending invitations to try again.
            </p>
          )}

          {error && <p role="alert" className="text-body-md text-error">{error}</p>}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex rounded-xl bg-surface-container p-1" role="group" aria-label="How to add them">
            {tab("create", "Create account")}
            {tab("invite", "Email invitation")}
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-[#f9b4ae] bg-error-container p-3 text-body-md text-error">
              {error}
            </div>
          )}

          {mode === "create" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="m-first" className={labelClasses}>First name</label>
                <input id="m-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={saving} className={`${inputClasses} h-11`} />
              </div>
              <div>
                <label htmlFor="m-last" className={labelClasses}>Last name</label>
                <input id="m-last" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={saving} className={`${inputClasses} h-11`} />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="m-email" className={labelClasses}>Email address</label>
            <input
              id="m-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              disabled={saving}
              autoCapitalize="none"
              className={`${inputClasses} h-11`}
            />
          </div>

          {mode === "create" && (
            <>
              <div>
                <label htmlFor="m-dept" className={labelClasses}>Department</label>
                <input id="m-dept" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={saving} placeholder="Optional" className={`${inputClasses} h-11`} />
              </div>
              <div>
                <p className={labelClasses}>Access level</p>
                <PermissionPicker value={level} onChange={setLevel} disabled={saving} />
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}