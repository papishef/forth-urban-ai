import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Input } from "@forth-urban/ui";

export function formatMoneyInput(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US") : "";
}

function parseMoneyInput(value: string): number {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

export function MoneyInput<TFieldValues extends FieldValues>({
  control,
  name,
  id,
  min = 0,
  className,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  id: string;
  min?: number;
  className?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={formatMoneyInput(field.value)}
          min={min}
          onChange={(event) => field.onChange(parseMoneyInput(event.target.value))}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          className={className}
        />
      )}
    />
  );
}