/** ข้อความแจ้งเตือน/ข้อผิดพลาดที่แสดงต่อผู้ใช้ — ใช้ภาษาไทยทั้งหมด */
export const errors = {
  loginRequired: "กรุณาเข้าสู่ระบบ",
  forbidden: "ไม่มีสิทธิ์ดำเนินการนี้",

  taskIdRequired: "ต้องระบุรหัสภารกิจ",
  taskNotFound: "ไม่พบภารกิจ",
  taskTitleRequired: "กรุณาระบุชื่องาน",
  taskStatusInvalid: "สถานะภารกิจไม่ถูกต้อง",
  taskInputInvalid: "ข้อมูลภารกิจไม่ถูกต้อง",
  taskCannotDone:
    "ยังปิดงานไม่ได้ — ต้องมีหลักฐานที่อนุมัติแล้ว มีผู้ตรวจสอบ และความคืบหน้าที่ตรวจแล้วครบ 100%",
  taskEditCommitteeOnly: "คุณแก้ไขได้เฉพาะภารกิจในคณะกรรมการของตนเอง",
  subtaskNotFound: "ไม่พบงานย่อย",
  subtaskEditCommitteeOnly: "คุณแก้ไขได้เฉพาะงานย่อยในคณะกรรมการของตนเอง",

  subtaskTitleRequired: "กรุณาระบุชื่องานย่อย",
  reportedProgressRange: "ความคืบหน้าที่รายงานต้องอยู่ระหว่าง 0–100",
  verifiedProgressRange: "ความคืบหน้าที่ตรวจแล้วต้องอยู่ระหว่าง 0–100",
  taskOwnerRequired: "ต้องมีผู้รับผิดชอบก่อนเริ่มงาน",
  taskDateInvalid: "วันเริ่มต้องไม่ช้ากว่าวันสิ้นสุด",
  criticalTaskDueDate: "งานสำคัญต้องมีวันครบกำหนด",
  budgetAmountNegative: "จำนวนเงินงบประมาณต้องไม่ติดลบ",
  budgetLinkRequired: "รายการงบต้องเชื่อมกับโปรเจกต์และภารกิจหรือแผนงาน",

  evidenceStatusInvalid: "สถานะหลักฐานไม่ถูกต้อง",
  evidenceNotFound: "ไม่พบหลักฐาน",
  evidenceUploadCommitteeOnly: "คุณอัปโหลดหลักฐานได้เฉพาะภารกิจในคณะกรรมการของตนเอง",
  evidenceReviewCommitteeOnly: "คุณตรวจหลักฐานได้เฉพาะในคณะกรรมการของตนเอง",

  noActiveProject: "ไม่พบโปรเจกต์ที่ใช้งาน",
  projectIdRequired: "ต้องระบุรหัสโปรเจกต์",
  projectAccessDenied: "ไม่มีสิทธิ์เข้าถึงโปรเจกต์นี้",
  taskWrongProject: "ภารกิจไม่อยู่ในโปรเจกต์ที่เลือก",

  snapshotRequired: "ต้องมี Snapshot ก่อนสร้างรายงาน",
  snapshotNotFound: "ไม่พบ Snapshot",
  reportNotFound: "ไม่พบรายงาน",
  reportEmpty: "ไฟล์รายงานว่าง",
  reportJobNotFound: "ไม่พบงานสร้างรายงาน",
  reportGenerationFailed: "สร้างรายงานไม่สำเร็จ",

  fileNotFound: "ไม่พบไฟล์",
  fileStorageNotFound: "ไม่พบไฟล์บนที่เก็บข้อมูล",
  fileInvalidStorage: "เส้นทางเก็บไฟล์ไม่ถูกต้อง",
  fileEmptyStorage: "ไฟล์บนที่เก็บข้อมูลว่างเปล่า",
  storageUnavailable: "ไม่สามารถเชื่อมต่อที่เก็บไฟล์ได้",
  notAFile: "ไม่ใช่ไฟล์",

  idRequired: "ต้องระบุรหัส",
  statusInvalid: "สถานะไม่ถูกต้อง",
  dataInvalid: "ข้อมูลไม่ถูกต้อง",
  saveFailed: "บันทึกไม่สำเร็จ",

  committeeNotFound: "ไม่พบคณะกรรมการ",
  committeeNameRequired: "กรุณาระบุชื่อคณะกรรมการ",
  committeeHasTasks: "ไม่สามารถลบคณะที่ยังมีภารกิจอยู่",
  committeeMemberNotFound: "ไม่พบสมาชิกในคณะ",
  committeeMemberExists: "ผู้ใช้นี้เป็นสมาชิกคณะนี้อยู่แล้ว",
  committeeMemberUserRequired: "กรุณาเลือกผู้ใช้",
  committeeMemberPositionRequired: "กรุณาระบุตำแหน่งในคณะ",
  committeeManageForbidden: "คุณไม่มีสิทธิ์จัดการคณะกรรมการนี้",

  riskNotFound: "ไม่พบความเสี่ยง",
  riskTitleRequired: "กรุณาระบุชื่อความเสี่ยง",
  riskManageForbidden: "คุณไม่มีสิทธิ์จัดการความเสี่ยงนี้",

  meetingNotFound: "ไม่พบการประชุม",
  meetingTitleRequired: "กรุณาระบุชื่อการประชุม",
  meetingManageForbidden: "คุณไม่มีสิทธิ์จัดการการประชุม",

  auditForbidden: "คุณไม่มีสิทธิ์ดูบันทึกการตรวจสอบ"
} as const;

/** อ่านข้อความ error จาก Response ของ API */
export async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) return body.error;
  } catch {
  }
  return fallback;
}
