'use client';

import Link from 'next/link';
import { AppHeader, AppFooter } from '@/components/layout';
import { FeatureCard, PortalCard } from '@/components/features/home';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
              <Badge variant="outline" className="mb-6 px-4 py-2 bg-primary/10 border-primary/20">
                <span className="text-sm font-medium text-primary">
                  Decentralized Anonymous Sovereign Health Identity
                </span>
              </Badge>

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
                <Button asChild size="lg" className="px-8 py-6 text-lg shadow-lg hover:shadow-xl">
                  <Link href="/patient">
                    Get Started
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8 py-6 text-lg">
                  <Link href="/studies">
                    Browse Studies
                  </Link>
                </Button>
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

