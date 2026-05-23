import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ProfileForm } from "@/components/profile-form";
import { Card } from "@/components/ui";
import { PageHeader, PageStack } from "@/components/page/page-layout";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const sessionUser = getSessionUser(session);
  if (!sessionUser) redirect("/login");

  const user = await prisma.user.findFirst({
    where: { id: sessionUser.id, deleted_at: null },
    select: { name: true, username: true }
  });
  if (!user) redirect("/login");

  return (
    <PageStack>
      <PageHeader
        title="โปรไฟล์ของฉัน"
        subtitle="แก้ไขชื่อเต็ม ชื่อผู้ใช้ และรหัสผ่านได้ด้วยตนเอง"
      />
      <Card className="max-w-lg p-4 sm:p-6">
        <ProfileForm initial={{ name: user.name, username: user.username }} />
      </Card>
    </PageStack>
  );
}
