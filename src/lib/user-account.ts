const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
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
  if (value.length < 6) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
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
