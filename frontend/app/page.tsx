"use client";

import Hero from "@/components/Hero";
import FlightResults from "@/components/FlightResults";
import Services from "@/components/Services";
import SearchWidget from "@/components/SearchWidget";
import TrendingDestinations from "@/components/TrendingDestination";
import Deals from "@/components/Deals";
import AIAssistant from "@/components/AIAssisstant";
import Footer from "@/components/Footer";
import Features from "@/components/Features";
export default function Home() {
  return (
    <main className="bg-[#0b1b2b] text-white min-h-screen">

      <Hero />

      <Services />
      <FlightResults />

      <SearchWidget />

      <TrendingDestinations />

      <Deals />

      <Features />

      <Footer />

      <AIAssistant />

    </main>
  );
}