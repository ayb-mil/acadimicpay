import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getServiceBySlug } from "@/lib/content";
import { saveSubmission } from "@/lib/submissions";
import { validateContactPayload, type ContactPayload } from "@/lib/validation";

export async function POST(request: NextRequest) {
  let payload: Partial<ContactPayload>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const validationError = validateContactPayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { name, contact, serviceSlug, amount, message } = payload as ContactPayload;
  const service = getServiceBySlug(serviceSlug);
  const submittedAt = new Date().toISOString();

  try {
    saveSubmission({ name, contact, serviceSlug, amount: amount ?? "", message, submittedAt });
  } catch (error) {
    console.error("Failed to persist contact submission", error);
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.CONTACT_EMAIL_TO;
  const emailFrom = process.env.CONTACT_EMAIL_FROM ?? "onboarding@resend.dev";

  if (resendApiKey && emailTo) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: emailFrom,
        to: emailTo,
        replyTo: contact,
        subject: `Nouvelle demande — ${service?.title ?? serviceSlug}`,
        text: [
          `Nom : ${name}`,
          `Contact : ${contact}`,
          `Service : ${service?.title ?? serviceSlug}`,
          `Montant approximatif : ${amount || "non précisé"}`,
          "",
          "Message :",
          message,
        ].join("\n"),
      });
    } catch (error) {
      console.error("Failed to send contact email", error);
      return NextResponse.json(
        { error: "Le message a été enregistré mais l'email n'a pas pu être envoyé." },
        { status: 502 }
      );
    }
  } else {
    console.warn(
      "RESEND_API_KEY or CONTACT_EMAIL_TO not configured — email sending skipped, submission stored only."
    );
  }

  return NextResponse.json({ ok: true });
}
