// src/common/utils/generate-platform-serial.util.ts
export function generatePlatformSerial(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // '24'
  const month = String(now.getMonth() + 1).padStart(2, "0"); // '04'
  const randomPart = generateRandomLetters(8); // 'ABC'

  return `PLT-${year}${month}-${randomPart}`;
}

function generateRandomLetters(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
