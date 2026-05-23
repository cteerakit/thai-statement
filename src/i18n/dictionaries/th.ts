import { PRODUCT_NAME } from "@/i18n/brand";
import type { Dictionary } from "@/i18n/types";

export const dictionary: Dictionary = {
  meta: {
    title: PRODUCT_NAME,
    description:
      "แปลงสเตทเมนต์ PDF ดิจิทัลจาก SCB, KBank และ KTB เป็น CSV หรือ Excel ฟรี ไม่ต้องเข้าสู่ระบบ",
  },
  nav: {
    language: "ภาษา",
  },
  footer: {
    processed: "ประมวลผล PDF ในหน่วยความจำแล้วทิ้งทันที",
    privacy: "ความเป็นส่วนตัว",
    terms: "ข้อกำหนด",
  },
  home: {
    title: "แปลงสเตทเมนต์ธนาคารไทย",
    subtitle:
      "อัปโหลดสเตทเมนต์ PDF ดิจิทัลแล้วดาวน์โหลดไฟล์ CSV หรือ Excel ที่จัดรูปแบบแล้ว ไม่ต้องมีบัญชี",
    convertTitle: "แปลงสเตทเมนต์ของคุณ",
    convertDescription:
      "รองรับ PDF แบบข้อความสูงสุด 10 MB รวมไฟล์ที่มีรหัสผ่าน ยังไม่รองรับ PDF สแกน/รูปภาพ",
    featurePrivateTitle: "เป็นส่วนตัวโดยค่าเริ่มต้น",
    featurePrivateBody:
      "ประมวลผล PDF ในหน่วยความจำเท่านั้น และไม่มีการเก็บไฟล์",
    featureColumnsTitle: "คอลัมน์มาตรฐาน",
    featureColumnsBody:
      "วันที่ รายละเอียด เดบิต เครดิต ยอดคงเหลือ และอ้างอิง",
    featureBanksTitle: "ธนาคารไทย",
    featureBanksBody:
      "ตรวจจับ SCB, KBank และ KTB อัตโนมัติ พร้อมเลือกธนาคารเองได้",
  },
  upload: {
    dropzone: "วางไฟล์สเตทเมนต์ PDF ที่นี่",
    dropzoneHint: "PDF ดิจิทัลจาก SCB, KBank หรือ KTB · สูงสุด 10 MB",
    bank: "ธนาคาร",
    autoDetect: "ตรวจจับอัตโนมัติ",
    downloadFormat: "รูปแบบดาวน์โหลด",
    formatCsv: "CSV",
    formatXlsx: "Excel (XLSX)",
    preview: "ดูตัวอย่างรายการ",
    processing: "กำลังประมวลผล…",
    download: "ดาวน์โหลด",
    errorPdf: "กรุณาอัปโหลดไฟล์ PDF",
    errorChooseFile: "กรุณาเลือกไฟล์ PDF ก่อน",
    errorConversion: "การแปลงล้มเหลว",
    errorNetwork: "เครือข่ายมีปัญหา กรุณาลองอีกครั้ง",
    errorPasswordRequired: "กรุณาใส่รหัสผ่าน PDF เพื่อปลดล็อกสเตทเมนต์",
    errorPasswordInvalid: "รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง",
    pdfPassword: "รหัสผ่าน PDF",
    pdfPasswordHint: "ใช้กับสเตทเมนต์ที่มีรหัสผ่าน ไม่มีการเก็บรหัสผ่าน",
    bankLabel: "ธนาคาร",
    detectionConfidence: "ความมั่นใจในการตรวจจับ",
    account: "บัญชี",
    period: "ช่วงเวลา",
    transactions: "รายการ",
  },
  preview: {
    date: "วันที่",
    description: "รายละเอียด",
    debit: "เดบิต",
    credit: "เครดิต",
    balance: "ยอดคงเหลือ",
    showingRows:
      "แสดง {limit} จาก {total} แถวแรก ดาวน์โหลดไฟล์เต็มเพื่อดูรายการทั้งหมด",
  },
  privacy: {
    title: "นโยบายความเป็นส่วนตัว",
    updated: "อัปเดตล่าสุด: พฤษภาคม 2569",
    collectTitle: "ข้อมูลที่เราเก็บ",
    collectBody:
      "เราประมวลผล PDF ในหน่วยความจำเท่านั้นเพื่อดึงรายการ ไม่เก็บไฟล์ PDF และไม่ต้องมีบัญชี",
    notTitle: "สิ่งที่เราไม่ทำ",
    notSell: "เราไม่ขายข้อมูลของคุณ",
    notAds: "เราไม่ใช้สเตทเมนต์ของคุณเพื่อโฆษณา",
    notScanned: "เวอร์ชันปัจจุบันยังไม่รองรับ PDF สแกน",
    limitsTitle: "จำกัดการใช้งาน",
    limitsBody:
      "การแปลงถูกจำกัดตาม IP เพื่อป้องกันการใช้งานในทางที่ผิด",
    contactTitle: "ติดต่อ",
    contactBody:
      "สำหรับคำถามด้านความเป็นส่วนตัว ติดต่อผู้ดูแลผ่านช่องทางที่คุณ deploy (เช่น GitHub issues ของโปรเจกต์นี้)",
  },
  terms: {
    title: "ข้อกำหนดการใช้งาน",
    updated: "อัปเดตล่าสุด: พฤษภาคม 2569",
    serviceTitle: "บริการ",
    serviceBody:
      "เครื่องมือนี้แปลงสเตทเมนต์ PDF ดิจิทัลจากธนาคารไทยที่รองรับเป็น CSV หรือ Excel ผลลัพธ์ขึ้นกับรูปแบบ PDF โปรดตรวจสอบกับสเตทเมนต์ต้นฉบับเสมอ",
    warrantyTitle: "ไม่มีการรับประกัน",
    warrantyBody:
      "ให้บริการตามสภาพที่เป็น เราไม่รับผิดชอบการตัดสินใจทางบัญชี ภาษี หรือการเงินจากไฟล์ที่แปลงแล้ว",
    useTitle: "การใช้งานที่ยอมรับได้",
    useBody:
      "อย่าอัปโหลดสเตทเมนต์ที่คุณไม่มีสิทธิ์ประมวลผล อย่าพยายามโหลดหรือใช้บริการในทางที่ผิด",
  },
};
