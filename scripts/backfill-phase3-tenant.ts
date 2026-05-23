/**
 * Backfill Organization + organization_id สำหรับ DB ที่มี Project อยู่แล้ว (ก่อน seed)
 * รัน: npx tsx scripts/backfill-phase3-tenant.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ORG_SLUG = "yunnan-329";
const ORG_NAME = "มูลนิธิกีฬา 329 ชาวจีนยูนาน";

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    create: { slug: ORG_SLUG, name: ORG_NAME },
    update: { name: ORG_NAME }
  });

  const updated = await prisma.project.updateMany({
    where: { organization_id: { not: org.id } },
    data: { organization_id: org.id, slug: "edition-legacy" }
  });

  const users = await prisma.user.findMany({ where: { deleted_at: null }, select: { id: true } });
  if (users.length) {
    await prisma.organizationMember.createMany({
      data: users.map((user) => ({ organization_id: org.id, user_id: user.id })),
      skipDuplicates: true
    });
  }

  const demoExists = await prisma.project.findFirst({
    where: { organization_id: org.id, slug: "edition-2571-demo" }
  });
  if (!demoExists) {
    await prisma.project.create({
      data: {
        organization_id: org.id,
        slug: "edition-2571-demo",
        name: "กีฬา 329 (รอบซ้อม)",
        edition: "รอบซ้อม 29 มี.ค. – 5 เม.ย. 2571 (ตัวอย่าง)",
        description: "โปรเจกต์ตัวอย่างสำหรับทดสอบสลับหลายรอบจัดงาน",
        event_date: new Date("2028-03-29"),
        event_end_date: new Date("2028-04-05"),
        planned_budget: 0
      }
    });
    console.log("Created demo project edition-2571-demo");
  }

  console.log(`Organization: ${org.slug} (${org.id})`);
  console.log(`Projects linked: ${updated.count}`);
  console.log(`Org members ensured for ${users.length} users`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
