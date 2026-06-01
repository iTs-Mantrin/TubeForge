import Link from 'next/link';
import { Download, Globe, Link2 } from 'lucide-react';
import { APP_NAME, APP_DOMAIN } from '@/lib/constants';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Home', href: '/' },
      { label: 'History', href: '/history' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', href: '/#faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/5 bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-600">
                <Download className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-surface-400 leading-relaxed max-w-xs">
              Download YouTube videos and audio instantly. No limits, no sign-up, completely free.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href={`https://${APP_DOMAIN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-surface-500 hover:text-white transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="text-surface-500 hover:text-white transition-colors"
              >
                <Link2 className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link Groups */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-white mb-3">
                {group.title}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-surface-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-500">
            &copy; {year} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-surface-500">
            {APP_DOMAIN} — Not affiliated with YouTube or Google.
          </p>
        </div>
      </div>
    </footer>
  );
}
