"use client";

import { useState } from "react";

export default function InquiryForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="serif mt-16 text-center text-3xl text-white/90">
        Thank you. A charter specialist will be in touch within a day.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="mx-auto mt-16 grid max-w-3xl gap-x-10 gap-y-4 md:grid-cols-2"
    >
      <input className="field" name="name" placeholder="Full name" required autoComplete="name" />
      <input className="field" name="email" type="email" placeholder="Email" required autoComplete="email" />
      <input className="field" name="destination" placeholder="Destination" />
      <input className="field" name="dates" placeholder="Preferred dates" />
      <input className="field" name="guests" type="number" min={1} placeholder="Guests" />
      <input className="field" name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" />
      <textarea className="field resize-none md:col-span-2" name="message" rows={3} placeholder="Tell us about your voyage" />
      <div className="mt-10 text-center md:col-span-2">
        <button
          type="submit"
          className="kicker rounded-full bg-gold px-12 py-4 font-medium text-navy-deep transition-[transform,background-color] duration-500 hover:scale-[1.03] hover:bg-[#d8b56f]"
        >
          Send inquiry
        </button>
      </div>
    </form>
  );
}
