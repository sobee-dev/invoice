// components/team/EditMemberModal.tsx
"use client";

import { useEffect, useState } from "react";
import { PermissionPicker } from "@/components/team/PermissionPicker";
import { Modal } from "@/components/ui/Modal";
import { btnNavy, btnOutline, inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { PermissionLevel, StaffMember, staffService } from "@/services/staff";
import { getApiErrorMessage } from "@/utils/getErrorMessage";

interface EditMemberModalProps {
  member: StaffMember | null;
  onClose: () => void;
  onSaved: (id: string, patch: { department: string; permissionLevel: PermissionLevel }) => void;
}

export function EditMemberModal({ member, onClose, onSaved }: EditMemberModalProps) {
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState<PermissionLevel>("limited_access");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!member) return;
    setDepartment(member.department ?? "");
    setLevel(member.permissionLevel);
    setSaving(false);
    setError("");
  }, [member]);

  const handleSave = async () => {
    if (!member || saving) return;
    setSaving(true);
    setError("");
    try {
      // The response carries only department and permissionLevel, so that is all we merge back.
      const updated = await staffService.updateStaffMember(member.id, {
        department: department.trim(),
        permissionLevel: level,
      });
      onSaved(member.id, updated);
      onClose();
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Could not save these changes. Please try again."));
      setSaving(false);
    }
  };

  return (
    <Modal
      open={member !== null}
      title="Edit member"
      subtitle={member ? `${member.fullName || member.email} · ${member.email}` : undefined}
      onClose={onClose}
      busy={saving}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className={btnOutline}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className={btnNavy}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <div role="alert" className="rounded-lg border border-[#f9b4ae] bg-error-container p-3 text-body-md text-error">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="e-dept" className={labelClasses}>Department</label>
          <input id="e-dept" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={saving} className={`${inputClasses} h-11`} />
        </div>
        <div>
          <p className={labelClasses}>Access level</p>
          <PermissionPicker value={level} onChange={setLevel} disabled={saving} />
        </div>
      </div>
    </Modal>
  );
}