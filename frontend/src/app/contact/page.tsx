'use client';

import { motion } from 'framer-motion';
import { Mail, MessageSquare, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ToastContainer from '@/components/ui/Toast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:manish.kumar@TubeForge.in?subject=${encodeURIComponent(
      `[Contact Form] ${formData.subject}`
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-950">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Contact Us
            </h1>
            <p className="text-surface-400 text-lg max-w-xl mx-auto">
              Have a question or need help? We&rsquo;d love to hear from you.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Contact Info Cards */}
            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="space-y-4 md:col-span-1"
            >
              <motion.div
                variants={fadeUp}
                className="glass rounded-2xl p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 mb-4">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Email</h3>
                <a
                  href="mailto:manish.kumar@TubeForge.in"
                  className="text-sm text-brand-400 hover:text-brand-300 transition-colors break-all"
                >
                  manish.kumar@TubeForge.in
                </a>
                <p className="text-xs text-surface-500 mt-2">
                  Send us an email anytime. We typically respond within 24 hours.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="glass rounded-2xl p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400 mb-4">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Support
                </h3>
                <a
                  href="mailto:manish.kumar@TubeForge.in"
                  className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
                >
                  manish.kumar@TubeForge.in
                </a>
                <p className="text-xs text-surface-500 mt-2">
                  For bug reports, feature requests, or any other inquiries.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="glass rounded-2xl p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-700 text-surface-300 mb-4">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Response Time
                </h3>
                <p className="text-sm text-surface-400">
                  Usually within <span className="text-white font-medium">24 hours</span>
                </p>
                <p className="text-xs text-surface-500 mt-2">
                  We reply Monday through Friday.
                </p>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="md:col-span-2"
            >
              <div className="glass rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-white mb-6">
                  Send us a message
                </h2>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10">
                        <Send className="h-6 w-6 text-brand-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Message sent!
                    </h3>
                    <p className="text-sm text-surface-400 mb-6 max-w-sm mx-auto">
                      Your email client has been opened. Please send your message
                      and we&rsquo;ll get back to you shortly.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          subject: '',
                          message: '',
                        });
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-surface-300 mb-1.5"
                        >
                          Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Your name"
                          className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-white/5 text-sm text-white placeholder-surface-500 outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-surface-300 mb-1.5"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-white/5 text-sm text-white placeholder-surface-500 outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-surface-300 mb-1.5"
                      >
                        Subject
                      </label>
                      <input
                        id="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        placeholder="How can we help?"
                        className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-white/5 text-sm text-white placeholder-surface-500 outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-surface-300 mb-1.5"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us more about your question or issue..."
                        className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-white/5 text-sm text-white placeholder-surface-500 outline-none focus:ring-2 focus:ring-brand-500/30 transition-all resize-y"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/25 transition-all"
                    >
                      <Send className="h-4 w-4" />
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
