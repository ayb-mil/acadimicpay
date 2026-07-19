import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import { getSiteContent } from "@/lib/content";
import { getDictionary } from "@/lib/i18n";

const site = getSiteContent();

/**
 * Layout du site AcadPay : header, footer et bouton WhatsApp flottant.
 *
 * Il ne s'applique qu'aux routes de ce groupe `(site)` — les parenthèses ne
 * changent pas les URL. Les offres autonomes (ex. /presentations) vivent en
 * dehors du groupe et n'héritent donc pas de cette navigation, ce qui garde
 * les deux positionnements séparés.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  const dictionary = getDictionary();

  return (
    <>
      <Header siteName={site.siteName} dictionary={dictionary} />
      <main className="flex-1">{children}</main>
      <Footer siteName={site.siteName} dictionary={dictionary} />
      <WhatsAppFloatingButton phoneNumber={site.contact.whatsappNumber} />
    </>
  );
}
