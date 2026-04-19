import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ProductCard } from "@/components/landing/ProductCard";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveMetrics } from "@/components/landing/LiveMetrics";
import { RiskManagement } from "@/components/landing/RiskManagement";
import { TrustCenter } from "@/components/landing/TrustCenter";
import { Documents } from "@/components/landing/Documents";
import { AccessForm } from "@/components/landing/AccessForm";
import { Footer } from "@/components/landing/Footer";
import { mockProduct, mockMetrics, mockDocuments } from "@/lib/mock-data";

// In production these would be SSR-fetched from internal APIs.
async function loadData() {
  return {
    product: mockProduct,
    metrics: mockMetrics,
    documents: mockDocuments,
  };
}

export default async function LandingPage() {
  const { product, metrics, documents } = await loadData();

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProductCard product={product} />
        <HowItWorks />
        <LiveMetrics metrics={metrics} />
        <RiskManagement />
        <TrustCenter />
        <Documents documents={documents} />
        <AccessForm />
      </main>
      <Footer />
    </>
  );
}
