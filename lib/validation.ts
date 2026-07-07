export interface ContactPayload {
  name: string;
  contact: string;
  serviceSlug: string;
  amount: string;
  message: string;
}

export function validateContactPayload(payload: Partial<ContactPayload>): string | null {
  if (!payload.name || payload.name.trim().length < 2) {
    return "Le nom est requis (2 caractères minimum).";
  }
  if (!payload.contact || payload.contact.trim().length < 5) {
    return "Un email ou un numéro WhatsApp valide est requis.";
  }
  if (!payload.serviceSlug) {
    return "Le service souhaité est requis.";
  }
  if (!payload.message || payload.message.trim().length < 10) {
    return "Le message doit contenir au moins 10 caractères.";
  }
  return null;
}
