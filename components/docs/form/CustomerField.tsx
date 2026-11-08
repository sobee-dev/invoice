// components/docs/form/CustomerField.tsx
"use client";

import { Icon } from "@/components/layout/Icon";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { inputClasses, labelClasses } from "@/components/ui/buttonStyles";
import { useAsyncSearch } from "@/hooks/useAsyncSearch";
import { Customer, customerService } from "@/services/customers";

interface CustomerFieldProps {
  name: string;
  onName: (value: string) => void;
  customerId?: string;
  onCustomerId: (id: string | undefined) => void;
  phone: string;
  onPhone: (value: string) => void;
  email: string;
  onEmail: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}

export function CustomerField(props: CustomerFieldProps) {
  const { name, customerId, invalid = false, disabled = false } = props;
  // Searching stops once a real client is linked.
  const { results, loading } = useAsyncSearch<Customer>(name, customerService.search, !customerId && !disabled);

  // Typing over a linked name breaks the link, since it may now be someone else.
  const handleName = (text: string) => {
    props.onName(text);
    if (customerId) props.onCustomerId(undefined);
  };

  const handleSelect = (c: Customer) => {
    props.onCustomerId(c.id);
    props.onName(c.fullName);
    props.onEmail(c.email ?? "");
    props.onPhone(c.phone ?? "");
  };

  return (
    <div className="space-y-5 max-sm:space-y-4">
      <div>
        <label htmlFor="doc-customer" className={labelClasses}>
          Customer name
        </label>
        <Autocomplete
          inputId="doc-customer"
          ariaLabel="Customer name"
          value={name}
          onChange={handleName}
          items={results}
          loading={loading}
          getKey={(c) => c.id}
          renderOption={(c) => ({ title: c.fullName, subtitle: c.email || c.phone })}
          onSelect={handleSelect}
          placeholder="Search your clients or type a new name"
          disabled={disabled}
          invalid={invalid}
        />

        {customerId ? (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-status-paid-fg max-sm:text-[11px]">
            <Icon name="check_circle" size={14} mobileSize={12} filled /> Linked to an existing client.
            <button
              type="button"
              onClick={() => props.onCustomerId(undefined)}
              disabled={disabled}
              className="font-semibold underline"
            >
              Unlink
            </button>
          </p>
        ) : (
          name.trim() && (
            <p className="mt-1.5 text-xs text-on-surface-variant max-sm:text-[11px]">
              No existing client is linked. The name, phone and email are saved on this document.
            </p>
          )
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 max-sm:gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="doc-phone" className={labelClasses}>
            Phone
          </label>
          <input
            id="doc-phone"
            type="tel"
            value={props.phone}
            onChange={(e) => props.onPhone(e.target.value)}
            disabled={disabled}
            className={`${inputClasses} h-11 max-sm:h-10`}
          />
        </div>
        <div>
          <label htmlFor="doc-email" className={labelClasses}>
            Email
          </label>
          <input
            id="doc-email"
            type="email"
            value={props.email}
            onChange={(e) => props.onEmail(e.target.value)}
            disabled={disabled}
            autoCapitalize="none"
            className={`${inputClasses} h-11 max-sm:h-10`}
          />
        </div>
      </div>
    </div>
  );
}