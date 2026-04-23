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
import { getCurrentHeadPrice } from "@/lib/product-pricing";

async function loadData() {
  const pricing = await getCurrentHeadPrice().catch(() => null);
  return {
    product: pricing
      ? { ...mockProduct, min_ticket: pricing.display }
      : mockProduct,
    metrics: mockMetrics,
    documents: mockDocuments,
    pricing,
  };
}

export default async function LandingPage() {
  const { product, metrics, documents, pricing } = await loadData();

  return (
    <>
      <Nav />
      <main>
        <Hero minDisplay={product.min_ticket} pricingAsOf={pricing?.asOf} />
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
