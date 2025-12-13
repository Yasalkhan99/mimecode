'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { ReactNode } from 'react';

interface LocalizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  [key: string]: any;
}

export default function LocalizedLink({ href, children, className, ...props }: LocalizedLinkProps) {
  const { getLocalizedPath } = useLanguage();
  const localizedHref = getLocalizedPath(href);

  return (
    <Link href={localizedHref} className={className} {...props}>
      {children}
    </Link>
  );
}

