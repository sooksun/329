import dayjs from "@/lib/dayjs";

export function parseDateInput(value: Date | string | number | null | undefined) {
  if (value == null || value === "") return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/** วันที่แบบ พ.ศ. เช่น 29 มี.ค. 2570 */
export function formatThaiDate(value: Date | string | number | null | undefined, pattern = "D MMM BBBB") {
  const parsed = parseDateInput(value);
  return parsed ? parsed.format(pattern) : "—";
}

export function formatThaiDateShort(value: Date | string | number | null | undefined) {
  return formatThaiDate(value, "D MMM BBBB");
}

export function formatThaiDateLong(value: Date | string | number | null | undefined) {
  return formatThaiDate(value, "D MMMM BBBB");
}

/** วันเวลาแบบ พ.ศ. เช่น 29 มี.ค. 2570 14:30 */
export function formatThaiDateTime(value: Date | string | number | null | undefined) {
  const parsed = parseDateInput(value);
  return parsed ? parsed.format("D MMM BBBB HH:mm") : "—";
}

export function formatThaiDateTimeShort(value: Date | string | number | null | undefined) {
  const parsed = parseDateInput(value);
  return parsed ? parsed.format("D/M/BBBB HH:mm") : "—";
}

export function toIsoString(value: Date | string | number | null | undefined) {
  const parsed = parseDateInput(value);
  return parsed ? parsed.toISOString() : "";
}

export function toDateOnlyIso(value: Date | string | number | null | undefined) {
  const parsed = parseDateInput(value);
  return parsed ? parsed.format("YYYY-MM-DD") : "";
}
