import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactSection from "@/components/landing/ContactSection";
import { spacing } from "@/utils/spacing";

export default function ContactUs() {
  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />
      <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1`}>
        <ContactSection querySource="contact-us" />
      </main>
      <section
        className={`w-full ${spacing.footer.gapTop}`}
        style={{ marginBottom: 0, paddingBottom: 0 }}
      >
        <Footer />
      </section>
    </div>
  );
}
