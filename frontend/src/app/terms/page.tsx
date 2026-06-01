import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { APP_NAME, APP_DOMAIN } from '@/lib/constants';

export const metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${APP_NAME} — the rules and guidelines for using our YouTube downloading service.`,
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    content:
      `By accessing and using ${APP_NAME} (${APP_DOMAIN}), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our service. These terms apply to all visitors, users, and others who access or use the service.`,
  },
  {
    title: '2. Description of Service',
    content:
      `${APP_NAME} provides a tool that allows users to download YouTube videos and audio content by pasting a URL. The service processes publicly accessible YouTube videos and generates downloadable files. We do not host, store, or distribute copyrighted content beyond the immediate processing and delivery of user-requested downloads.`,
  },
  {
    title: '3. User Responsibilities',
    content:
      'You agree to use the service only for lawful purposes and in compliance with applicable laws. You must not: (a) use the service to download content you do not have the right to access; (b) attempt to circumvent any rate limits, access controls, or technical restrictions; (c) use the service in any way that could damage, disable, overburden, or impair our infrastructure; (d) attempt to reverse engineer any aspect of the service.',
  },
  {
    title: '4. Copyright and Fair Use',
    content:
      `You are solely responsible for ensuring that your use of ${APP_NAME} complies with applicable copyright laws. The service is intended for downloading content you have the right to download, such as your own uploads, Creative Commons-licensed content, or content where the copyright holder has explicitly authorized downloading. We do not condone copyright infringement and reserve the right to terminate access for users who repeatedly infringe on others' copyrights.`,
  },
  {
    title: '5. Limitation of Liability',
    content:
      `${APP_NAME} is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the availability, reliability, or accuracy of the service. In no event shall ${APP_NAME} or its operators be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the service.`,
  },
  {
    title: '6. Service Availability',
    content:
      'We strive to provide uninterrupted service but do not guarantee that the service will be available at all times. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time without prior notice. We are not liable for any downtime, data loss, or service interruptions.',
  },
  {
    title: '7. Changes to Terms',
    content:
      'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to this page. Your continued use of the service after any changes constitutes acceptance of the new terms. We encourage you to review this page periodically.',
  },
  {
    title: '8. Contact',
    content:
      'If you have any questions about these Terms of Service, please contact us at manish.kumar@modifyly.in.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-950">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-surface-100 mb-4">
              Terms of Service
            </h1>
            <p className="text-surface-400 text-sm">
              Last updated: June 1, 2026
            </p>
          </div>

          {/* Content */}
          <div className="glass rounded-2xl p-6 sm:p-10 divide-y divide-(--border-subtle)">
            {sections.map((section) => (
              <div key={section.title} className="py-6 first:pt-0 last:pb-0">
                <h2 className="text-lg font-semibold text-surface-100 mb-3">
                  {section.title}
                </h2>
                <p className="text-sm text-surface-400 leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
