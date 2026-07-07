export function buildWhatsAppLink(phoneNumber: string, message?: string): string {
  const sanitizedPhone = phoneNumber.replace(/[^0-9]/g, "");
  const base = `https://wa.me/${sanitizedPhone}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
