import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeUsername, validatePassword, validateUsername } from "@/lib/user-account";

const assignableRoles = new Set([
  "Committee Lead",
  "Task Owner",
  "Data Recorder",
  "Finance Officer",
  "Evidence Reviewer",
  "Viewer"
]);

export async function listUsersForAdmin() {
  return prisma.user.findMany({
    where: { deleted_at: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      created_at: true,
      roles: { include: { role: { select: { name: true, label: true } } } },
      committeeLinks: {
        include: { committee: { select: { id: true, name: true } } }
      }
    }
  });
}

export async function createUserByAdmin(input: {
  name: string;
  username: string;
  password: string;
  roleName?: string;
  committeeId?: string;
  position?: string;
  createdById: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("กรุณาระบุชื่อ-นามสกุล");
  const usernameError = validateUsername(input.username);
  if (usernameError) throw new Error(usernameError);
  const passwordError = validatePassword(input.password, { required: true });
  if (passwordError) throw new Error(passwordError);

  const username = normalizeUsername(input.username);
  const exists = await prisma.user.findFirst({ where: { username, deleted_at: null } });
  if (exists) throw new Error("ชื่อผู้ใช้นี้มีในระบบแล้ว");

  const roleName = input.roleName && assignableRoles.has(input.roleName) ? input.roleName : "Task Owner";
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error("ไม่พบบทบาทที่เลือก");

  const password_hash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      password_hash,
      roles: { create: [{ role_id: role.id }] },
      ...(input.committeeId
        ? {
            committeeLinks: {
              create: {
                committee_id: input.committeeId,
                position: input.position?.trim() || "สมาชิกคณะ"
              }
            }
          }
        : {})
    },
    include: {
      roles: { include: { role: true } },
      committeeLinks: { include: { committee: true } }
    }
  });

  const org = await prisma.organization.findFirst({ where: { deleted_at: null }, orderBy: { created_at: "asc" } });
  if (org) {
    await prisma.organizationMember.upsert({
      where: { organization_id_user_id: { organization_id: org.id, user_id: user.id } },
      create: { organization_id: org.id, user_id: user.id },
      update: {}
    });
  }

  await prisma.auditLog.create({
    data: {
      user_id: input.createdById,
      action: "Create user",
      entity_type: "User",
      entity_id: user.id,
      new_value: JSON.stringify({ username: user.username, name: user.name, role: roleName })
    }
  });

  return user;
}

export async function listCommitteeMembers(committeeId: string) {
  return prisma.committeeMember.findMany({
    where: { committee_id: committeeId },
    include: { user: { select: { id: true, name: true, username: true } } },
    orderBy: { position: "asc" }
  });
}
