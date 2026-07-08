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

  // Message d'erreur générique renvoyé au frontend : on ne prétend JAMAIS
  // « succès » si l'email n'est pas réellement parti. L'utilisateur est
  // réorienté vers WhatsApp, et la vraie cause est loggée côté serveur.
  const failureMessage =
    "Votre message n'a pas pu être envoyé pour le moment. Merci de nous écrire directement sur WhatsApp.";

  // Sans configuration email, on NE renvoie PAS un faux succès.
  if (!resendApiKey || !emailTo) {
    console.error(
      `Email non configuré — RESEND_API_KEY ${resendApiKey ? "présent" : "MANQUANT"}, ` +
        `CONTACT_EMAIL_TO ${emailTo ? "présent" : "MANQUANT"}. Envoi impossible.`
    );
    return NextResponse.json({ error: failureMessage }, { status: 503 });
  }

  try {
    const resend = new Resend(resendApiKey);

    // ⚠️ Resend v4 ne LÈVE PAS d'exception sur erreur API : il faut inspecter
    // le champ `error` du retour, sinon l'échec est silencieux.
    const { data, error } = await resend.emails.send({
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

    if (error) {
      // Cause réelle visible dans les logs Vercel (ex. domaine non vérifié,
      // expéditeur invalide, destinataire non autorisé en mode test…).
      console.error("Resend a renvoyé une erreur :", JSON.stringify(error), {
        from: emailFrom,
        to: emailTo,
      });
      return NextResponse.json({ error: failureMessage }, { status: 502 });
    }

    console.log("Email de contact envoyé — id Resend :", data?.id);
  } catch (err) {
    // Exception réseau/inattendue (rare avec Resend v4).
    console.error("Exception lors de l'envoi de l'email de contact :", err);
    return NextResponse.json({ error: failureMessage }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
