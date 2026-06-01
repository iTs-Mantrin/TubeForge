'use client';

import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import SupportedPlatforms from '@/components/home/SupportedPlatforms';
import FAQ from '@/components/home/FAQ';
import Footer from '@/components/layout/Footer';
import ProgressModal from '@/components/download/ProgressModal';
import ToastContainer from '@/components/ui/Toast';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <SupportedPlatforms />
        <FAQ />
      </main>
      <Footer />
      <ProgressModal />
      <ToastContainer />
    </>
  );
}
