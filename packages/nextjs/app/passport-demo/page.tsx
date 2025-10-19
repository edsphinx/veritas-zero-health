/**
 * Passport Demo Page
 *
 * Demonstration page for Gitcoin Passport integration.
 * Shows both PassportButton and PassportCard components.
 */

'use client';

import Link from 'next/link';
import { AppHeader, AppFooter } from '@/components/layout';
import { PassportButton, PassportCard } from '@/components/features/passport';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PassportDemoPage() {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Gitcoin Passport Integration
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Sybil-resistant identity verification using Gitcoin Passport
            </p>
          </div>

          {/* What is Gitcoin Passport */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What is Gitcoin Passport?</CardTitle>
              <CardDescription>
                A Sybil-resistant identity verification system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Gitcoin Passport is a decentralized identity protocol that helps prove
                you&apos;re a real human without revealing personal information. It uses
                &quot;stamps&quot; - verifiable credentials from various platforms and services.
              </p>
              <p>
                The more stamps you collect, the higher your humanity score. DASHI uses
                this score to prevent fake accounts and ensure one identity per person.
              </p>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://passport.xyz', '_blank')}
                >
                  Visit Gitcoin Passport →
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open('https://docs.passport.xyz', '_blank')
                  }
                >
                  Read Documentation →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PassportButton Demo */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>PassportButton Component</CardTitle>
              <CardDescription>
                Quick verification status button
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Default (auto-verify)</h4>
                  <PassportButton />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">With score display</h4>
                  <PassportButton showScore />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PassportCard Demo */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>PassportCard Component</CardTitle>
              <CardDescription>
                Detailed verification status card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PassportCard showStamps />
            </CardContent>
          </Card>

          {/* Integration Guide */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Integration Guide</CardTitle>
              <CardDescription>
                How to use Passport components in your app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">1. Import the components</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`import { PassportButton, PassportCard } from '@/components/features/passport';`}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">2. Use PassportButton</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`<PassportButton
  autoVerify
  showScore
  onVerificationComplete={(verified, score) => {
    console.log(\`Verified: \${verified}, Score: \${score}\`);
  }}
/>`}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">3. Use PassportCard</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`<PassportCard
  showStamps
  address="0x..." // Optional, uses connected wallet by default
/>`}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">4. Use the hook</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`import { usePassport } from '@/hooks/usePassport';

const { verifyPassport, isVerified, score } = usePassport();

// Verify an address
await verifyPassport('0x...');`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Environment Variables Required</CardTitle>
              <CardDescription>
                Add these to your .env.local file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{`NEXT_PUBLIC_PASSPORT_API_KEY=your_api_key_here
NEXT_PUBLIC_PASSPORT_SCORER_ID=your_scorer_id_here`}</code>
              </pre>
              <p className="text-sm text-muted-foreground mt-4">
                Get your API key and Scorer ID from the{' '}
                <a
                  href="https://scorer.gitcoin.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Gitcoin Passport Scorer Dashboard
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Button asChild variant="outline">
              <Link href="/">← Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
