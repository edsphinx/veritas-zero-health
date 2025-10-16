'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  Lock,
  UserCheck,
  Users,
  FlaskConical,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { AppHeader, AppFooter } from '@/components/layout';
import { useAuth } from '@/shared/hooks/useAuth';
import { UserRole } from '@/shared/types/auth.types';

export default function Home() {
  const auth = useAuth();

  // Determine primary CTA based on user role
  const getPrimaryCTA = () => {
    if (!auth.isAuthenticated) {
      return { label: 'Get Started', href: '/onboarding' };
    }

    switch (auth.role) {
      case UserRole.PATIENT:
        return { label: 'Go to Dashboard', href: '/patient' };
      case UserRole.CLINIC:
        return { label: 'Go to Dashboard', href: '/clinic' };
      case UserRole.RESEARCHER:
        return { label: 'Go to Dashboard', href: '/researcher' };
      case UserRole.SPONSOR:
        return { label: 'Go to Dashboard', href: '/sponsor' };
      case UserRole.ADMIN:
        return { label: 'Go to Dashboard', href: '/admin' };
      case UserRole.SUPERADMIN:
        return { label: 'Go to Dashboard', href: '/superadmin' };
      default:
        return { label: 'Get Started', href: '/onboarding' };
    }
  };

  const primaryCTA = getPrimaryCTA();
  return (
    <>
      <AppHeader />
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Decentralized Anonymous Sovereign Health Identity
              </span>
            </motion.div>

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
                href={primaryCTA.href}
                className="group px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold text-lg"
              >
                {primaryCTA.label}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/studies"
                className="px-8 py-4 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all border border-border flex items-center gap-2 font-medium text-lg"
              >
                <FlaskConical className="h-5 w-5" />
                Browse Studies
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Zero-Knowledge Proofs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Encrypted Data Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Human Verified</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Privacy-First Health Identity
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              DASHI combines cutting-edge cryptography with decentralized storage
              to give you complete control over your medical data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Zero-Knowledge Proofs"
              description="Prove eligibility for clinical studies without revealing your actual medical data. Your privacy is mathematically guaranteed."
              delay={0.1}
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8" />}
              title="Encrypted Storage"
              description="Medical records encrypted with Nillion's secure multi-party computation. Only you control access."
              delay={0.2}
            />
            <FeatureCard
              icon={<UserCheck className="h-8 w-8" />}
              title="Sybil-Resistant"
              description="Human Passport integration ensures one identity per person, preventing fake accounts."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Choose Your Portal
            </h2>
            <p className="text-lg text-muted-foreground">
              Access DASHI based on your role in the healthcare ecosystem
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <PortalCard
              icon={<Users className="h-10 w-10 text-primary" />}
              title="Patient Portal"
              description="Create your DASHI identity, store medical records privately, and apply to clinical studies."
              href="/patient"
              delay={0.1}
            />
            <PortalCard
              icon={<FlaskConical className="h-10 w-10 text-secondary" />}
              title="Researcher Portal"
              description="Create studies, verify patient eligibility through ZK proofs, and manage study data."
              href="/researcher"
              delay={0.2}
            />
            <PortalCard
              icon={<DollarSign className="h-10 w-10 text-success" />}
              title="Sponsor Portal"
              description="Fund research studies, track funding allocation, and monitor study progress."
              href="/sponsor"
              delay={0.3}
            />
            <PortalCard
              icon={<Building2 className="h-10 w-10 text-accent" />}
              title="Clinic Portal"
              description="Issue verifiable medical credentials, update patient records, manage appointments."
              href="/clinic"
              delay={0.4}
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
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow"
    >
      <div className="rounded-lg bg-primary/10 w-fit p-3 mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function PortalCard({
  icon,
  title,
  description,
  href,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <Link
        href={href}
        className="block p-8 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all group"
      >
        <div className="mb-4 rounded-lg bg-muted w-fit p-3">{icon}</div>
        <h3 className="text-2xl font-bold mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>
        <div className="flex items-center gap-2 font-medium text-primary group-hover:gap-3 transition-all">
          Enter Portal
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </motion.div>
  );
}
