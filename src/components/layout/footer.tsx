
"use client"; // Add "use client" if not already present for hooks

import React, { useState, useEffect } from 'react';

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-6 px-6 border-t mt-auto">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>&copy; {currentYear || new Date().getFullYear()} StockSage 2.0. All Rights Reserved.</p>
        <p className="mt-2">
          Disclaimer: StockSage 2.0 provides financial data and AI-generated analysis for informational purposes only.
          It is not financial advice. Consult with a qualified financial advisor before making investment decisions.
        </p>
      </div>
    </footer>
  );
}
