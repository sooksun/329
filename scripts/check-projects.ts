import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      slug: true,
      name: true,
      edition: true,
      created_at: true,
      _count: { select: { tasks: true, committees: true } }
    },
    orderBy: { created_at: "desc" }
  });
  console.table(
    projects.map((p) => ({
      slug: p.slug,
      edition: p.edition,
      tasks: p._count.tasks,
      committees: p._count.committees,
      created: p.created_at.toISOString().slice(0, 10)
    }))
  );
}

main()
  .finally(() => prisma.$disconnect());
