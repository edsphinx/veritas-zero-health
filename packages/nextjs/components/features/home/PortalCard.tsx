import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface PortalCardProps {
  title: string;
  description: string;
  href: string;
}

export function PortalCard({ title, description, href }: PortalCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full hover:border-primary/40 hover:shadow-lg transition-all group cursor-pointer">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <div className="flex items-center gap-2 font-medium text-primary group-hover:gap-3 transition-all">
            Enter Portal
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
