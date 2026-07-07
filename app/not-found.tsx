import Link from "next/link";
import Container from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-serif text-3xl font-semibold text-encre">Page introuvable</h1>
      <p className="mt-3 text-ardoise">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="mt-6 font-semibold text-bleu-700 hover:underline">
        Retour à l&apos;accueil
      </Link>
    </Container>
  );
}
