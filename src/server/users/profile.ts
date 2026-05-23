import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeUsername, validateProfileInput } from "@/lib/user-account";

export async function updateOwnProfile(
  userId: string,
  input: { name: string; username: string; password?: string; currentPassword?: string }
) {
  const validationError = validateProfileInput(input);
  if (validationError) throw new Error(validationError);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deleted_at) throw new Error("ไม่พบบัญชีผู้ใช้");

  const username = normalizeUsername(input.username);
  const duplicate = await prisma.user.findFirst({
    where: { username, id: { not: userId }, deleted_at: null }
  });
  if (duplicate) throw new Error("ชื่อผู้ใช้นี้มีในระบบแล้ว");

  const data: { name: string; username: string; password_hash?: string } = {
    name: input.name.trim(),
    username
  };

  if (input.password) {
    const ok = await bcrypt.compare(input.currentPassword ?? "", user.password_hash);
    if (!ok) throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
    data.password_hash = await bcrypt.hash(input.password, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, username: true, email: true }
  });
}
