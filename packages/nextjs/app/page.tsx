'use client';

import Link from 'next/link';
import { AppHeader, AppFooter } from '@/components/layout';

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="text-sm font-medium text-primary">
                  Decentralized Anonymous Sovereign Health Identity
                </span>
              </div>

              {/* Title */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  DASHI
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl sm:text-2xl text-muted-foreground mb-4 leading-relaxed">
                Own your health data. Prove without revealing.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground/80 mb-8 max-w-2xl mx-auto">
                Privacy-preserving health identity powered by Zero-Knowledge Proofs,
                encrypted storage, and Sybil-resistant verification.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  href="/patient"
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
                >
                  Get Started
                </Link>
                <Link
                  href="/studies"
                  className="px-8 py-4 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all border border-border font-medium text-lg"
                >
                  Browse Studies
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span>Zero-Knowledge Proofs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span>Encrypted Data Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span>Human Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Privacy-First Health Identity
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                DASHI combines cutting-edge cryptography with decentralized storage
                to give you complete control over your medical data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard
                title="Zero-Knowledge Proofs"
                description="Prove eligibility for clinical studies without revealing your actual medical data. Your privacy is mathematically guaranteed."
              />
              <FeatureCard
                title="Encrypted Storage"
                description="Medical records encrypted with Nillion's secure multi-party computation. Only you control access."
              />
              <FeatureCard
                title="Sybil-Resistant"
                description="Human Passport integration ensures one identity per person, preventing fake accounts."
              />
            </div>
          </div>
        </section>

        {/* Portals Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Choose Your Portal
              </h2>
              <p className="text-lg text-muted-foreground">
                Access DASHI based on your role in the healthcare ecosystem
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              <PortalCard
                title="Patient Portal"
                description="Create your DASHI identity, store medical records privately, and apply to clinical studies."
                href="/patient"
              />
              <PortalCard
                title="Researcher Portal"
                description="Create studies, verify patient eligibility through ZK proofs, and manage study data."
                href="/researcher"
              />
              <PortalCard
                title="Sponsor Portal"
                description="Fund research studies, track funding allocation, and monitor study progress."
                href="/sponsor"
              />
              <PortalCard
                title="Clinic Portal"
                description="Issue verifiable medical credentials, update patient records, manage appointments."
                href="/clinic"
              />
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function PortalCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block p-8 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all"
    >
      <h3 className="text-2xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-2 font-medium text-primary">
        Enter Portal →
      </div>
    </Link>
  );
}
