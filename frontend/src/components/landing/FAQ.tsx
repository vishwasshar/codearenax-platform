import { useState } from "react";
import { ChevronDown } from "lucide-react";

import GlassCard from "../ui/GlassCard";
import SectionHeading from "../ui/SectionHeading";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is CodeArenaX?",
    answer:
      "CodeArenaX is a real-time collaborative coding platform that enables multiple developers to edit code simultaneously, communicate through chat and video calls, and execute code in multiple programming languages from a single workspace.",
  },
  {
    question: "How does real-time collaboration work?",
    answer:
      "The editor uses Yjs (CRDT) for conflict-free synchronization and Socket.IO for real-time communication, ensuring all participants see updates instantly without merge conflicts.",
  },
  {
    question: "Which programming languages are supported?",
    answer:
      "Currently CodeArenaX supports JavaScript, Python and C++. The execution engine is designed to be extensible for additional languages in the future.",
  },
  {
    question: "How is code executed securely?",
    answer:
      "Source code is sent to a dedicated execution service where it is compiled or interpreted inside isolated temporary workspaces. Execution results are returned while temporary files are cleaned automatically.",
  },
  {
    question: "How are voice and video calls implemented?",
    answer:
      "CodeArenaX uses MediaSoup as an SFU (Selective Forwarding Unit) for scalable low-latency audio and video communication between collaborators.",
  },
  {
    question: "Which technologies are used?",
    answer:
      "React, TypeScript, NestJS, MongoDB, Socket.IO, Yjs CRDT, MediaSoup, Redis, Monaco Editor, JWT Authentication, Google OAuth, Docker and an Express-based execution service.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading
          badge="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about CodeArenaX."
        />

        <div className="space-y-5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <GlassCard key={faq.question} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-7 py-6 text-left transition hover:bg-white/5"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {faq.question}
                  </h3>

                  <ChevronDown
                    className={`transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-cyan-400" : "text-slate-400"
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-7 pb-7 text-slate-400 leading-7">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
