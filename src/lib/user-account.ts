const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

const THAI_LEADING_VOWELS = new Set(["เ", "แ", "โ", "ใ", "ไ"]);
const THAI_LOW_AFTER_HO = new Set(["ง", "ญ", "น", "ม", "ย", "ร", "ล", "ว"]);

function thaiWordInitial(word: string) {
  let w = word.replace(/^(แซ่|แช่)(?=\S)/, "");
  if (!w) w = word;
  let i = 0;
  while (i < w.length && THAI_LEADING_VOWELS.has(w[i])) i++;
  if (w[i] === "ห" && THAI_LOW_AFTER_HO.has(w[i + 1] ?? "")) i++;
  return w[i] ?? "";
}

/** ตัวย่อ 2 ตัวจากชื่อ-นามสกุล เช่น "สินชัย แซ่ลี 李靜平" → "สล" (ข้ามสระนำ, ห นำ, คำว่า "แซ่", ตัวอักษรจีน) */
export function nameInitials(fullName: string) {
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter((w) => /[฀-๿a-zA-Z]/.test(w));
  const initials = words
    .slice(0, 2)
    .map((w) => (/^[฀-๿]/.test(w) ? thaiWordInitial(w) : w[0].toUpperCase()))
    .join("");
  return initials || fullName.trim().slice(0, 2);
}

export function validateUsername(value: string) {
  const username = normalizeUsername(value);
  if (!username) return "กรุณาระบุชื่อผู้ใช้";
  if (!USERNAME_PATTERN.test(username)) {
    return "ชื่อผู้ใช้ใช้ a-z ตัวเลข . _ - อย่างน้อย 3 ตัว (ไม่ต้องเป็นอีเมล)";
  }
  return null;
}

export function validatePassword(value: string, options?: { required?: boolean }) {
  if (!value) {
    return options?.required ? "กรุณาระบุรหัสผ่าน" : null;
  }
  if (value.length < 10) return "รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร";
  if (value.length > 128) return "รหัสผ่านยาวเกินไป (ไม่เกิน 128 ตัวอักษร)";
  return null;
}

export function validateProfileInput(input: {
  name: string;
  username: string;
  password?: string;
  currentPassword?: string;
}) {
  const name = input.name.trim();
  if (!name) return "กรุณาระบุชื่อ-นามสกุล";
  const usernameError = validateUsername(input.username);
  if (usernameError) return usernameError;
  if (input.password) {
    const passwordError = validatePassword(input.password, { required: true });
    if (passwordError) return passwordError;
    if (!input.currentPassword?.trim()) return "กรุณากรอกรหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่านใหม่";
  }
  return null;
}
