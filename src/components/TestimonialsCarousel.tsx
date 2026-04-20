"use client";

import { useEffect, useState } from "react";

const testimonials = [
  {
    quote:
      "I used Mentra before my final submission and raised my score from 74 to 89 in two revisions.",
    person: "Maya T., Engineering Student",
  },
  {
    quote:
      "Our organization rules are finally clear for students. Feedback now points to exact criteria, not vague notes.",
    person: "Daniel R., Program Coordinator",
  },
  {
    quote:
      "The improvement trend made it obvious where I kept losing points. I could actually fix patterns before grading.",
    person: "Nina L., Social Science Student",
  },
];

export default function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const active = testimonials[index];

  return (
    <article className="rounded-2xl border border-black/10 bg-slate-900 p-6 text-slate-100 shadow-md shadow-[#0f172a]/25">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5eead4]">
        User testimonials
      </p>
      <blockquote className="mt-4 min-h-28 text-lg leading-8 transition duration-300">
        &ldquo;{active.quote}&rdquo;
      </blockquote>
      <p className="mt-3 text-sm font-semibold text-slate-300">{active.person}</p>
      <div className="mt-6 flex gap-2">
        {testimonials.map((item, itemIndex) => (
          <button
            key={item.person}
            type="button"
            onClick={() => setIndex(itemIndex)}
            className={`h-2.5 w-8 rounded-full transition ${
              index === itemIndex ? "bg-[#5eead4]" : "bg-slate-600"
            }`}
            aria-label={`Show testimonial ${itemIndex + 1}`}
          />
        ))}
      </div>
    </article>
  );
}
