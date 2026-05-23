import { Badge, Card } from "@/components/ui";
import { CardGrid, PageHeader, PageStack } from "@/components/page/page-layout";

const steps = [
  "เลือกภารกิจ",
  "ถ่ายภาพหลักฐาน",
  "กรอกคำบรรยาย",
  "ส่งให้ผู้ตรวจสอบ",
  "แก้ไขหากไม่ผ่าน",
  "ปิดงานเมื่อ Verified 100%"
];

export default function MobilePage() {
  return (
    <PageStack>
      <PageHeader title="ขั้นตอนบนมือถือ" subtitle="คู่มือสั้นสำหรับเจ้าหน้าที่ภาคสนาม" />
      <CardGrid cols={2}>
        {steps.map((step, i) => (
          <Card className="p-4 sm:p-5" key={step}>
            <Badge tone="blue">ขั้นตอน {i + 1}</Badge>
            <h2 className="mt-3 text-lg font-black leading-snug sm:mt-4 sm:text-xl">{step}</h2>
          </Card>
        ))}
      </CardGrid>
    </PageStack>
  );
}
