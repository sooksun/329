"use client";

import { DatePicker } from "antd";
import type { DatePickerProps } from "antd";
import { useState } from "react";
import dayjs, { type Dayjs } from "@/lib/dayjs";
import { buddhistPickerLocale } from "@/lib/antd-locale";
import { cn } from "@/lib/utils";

const dateFormat = "DD MMM BBBB";
const dateTimeFormat = "DD MMM BBBB HH:mm";

type BaseProps = {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function ThaiDatePicker({
  value,
  onChange,
  className,
  placeholder = "เลือกวันที่",
  disabled
}: BaseProps & {
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
}) {
  return (
    <DatePicker
      locale={buddhistPickerLocale}
      format={dateFormat}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn("w-full", className)}
    />
  );
}

export function ThaiDateTimePicker({
  value,
  onChange,
  className,
  placeholder = "เลือกวันเวลา",
  disabled
}: BaseProps & {
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
}) {
  return (
    <DatePicker
      showTime={{ format: "HH:mm" }}
      locale={buddhistPickerLocale}
      format={dateTimeFormat}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      needConfirm={false}
      className={cn("w-full", className)}
    />
  );
}

/** ใช้ในฟอร์ม HTML — ส่งค่า ISO ผ่าน hidden input */
export function FormDateField({
  name,
  defaultValue,
  required,
  className
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState<Dayjs | null>(defaultValue ? dayjs(defaultValue) : null);

  return (
    <>
      <input type="hidden" name={name} value={value ? value.format("YYYY-MM-DD") : ""} required={required && !value} />
      <ThaiDatePicker value={value} onChange={setValue} className={className} />
    </>
  );
}

export function FormDateTimeField({
  name,
  defaultValue,
  required,
  className
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState<Dayjs | null>(defaultValue ? dayjs(defaultValue) : null);

  return (
    <>
      <input type="hidden" name={name} value={value ? value.toISOString() : ""} required={required && !value} />
      <ThaiDateTimePicker value={value} onChange={setValue} className={className} />
    </>
  );
}

export type { DatePickerProps };
