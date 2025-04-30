// src/common/utils/password-generator.ts

export function generateSecurePassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + symbols;

  if (length < 8) {
    throw new Error('Password length must be at least 8 characters');
  }

  const getRandomChar = (charset: string) => charset[Math.floor(Math.random() * charset.length)];

  let password = [
    getRandomChar(uppercase),
    getRandomChar(lowercase),
    getRandomChar(numbers),
    getRandomChar(symbols),
  ];

  for (let i = password.length; i < length; i++) {
    password.push(getRandomChar(allChars));
  }

  password = password.sort(() => Math.random() - 0.5);

  return password.join('');
}
