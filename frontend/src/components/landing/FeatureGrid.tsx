import {
  Code2,
  Users,
  Video,
  Terminal,
  ShieldCheck,
  Database,
  Workflow,
  Server,
  Layers3,
} from "lucide-react";

import SectionHeading from "../ui/SectionHeading";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: Users,
    title: "Real-Time Collaboration",
    description:
      "Collaborate with multiple developers simultaneously using Yjs CRDT and Socket.IO for conflict-free synchronization.",
    accent: "cyan" as const,
    tags: ["Yjs", "Socket.IO", "CRDT"],
  },
  {
    icon: Code2,
    title: "Monaco Code Editor",
    description:
      "Powered by the same editor used in VS Code with syntax highlighting, IntelliSense support, themes, and multi-language editing.",
    accent: "purple" as const,
    tags: ["Monaco", "VS Code"],
  },
  {
    icon: Terminal,
    title: "Multi-Language Execution",
    description:
      "Execute JavaScript, Python and C++ securely through an isolated execution service with live output.",
    accent: "orange" as const,
    tags: ["JavaScript", "Python", "C++"],
  },
  {
    icon: Video,
    title: "Voice & Video Calls",
    description:
      "Integrated MediaSoup-powered SFU enables high-quality audio and video communication inside coding rooms.",
    accent: "green" as const,
    tags: ["MediaSoup", "WebRTC"],
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    description:
      "Protect collaboration rooms using JWT authentication and seamless Google OAuth login.",
    accent: "cyan" as const,
    tags: ["JWT", "OAuth"],
  },
  {
    icon: Workflow,
    title: "Room Collaboration",
    description:
      "Create collaborative rooms, invite developers, chat, share code, and work together in real time.",
    accent: "purple" as const,
    tags: ["Rooms", "Chat"],
  },
  {
    icon: Database,
    title: "Scalable Storage",
    description:
      "MongoDB stores users, rooms, messages, and collaboration data while Redis accelerates real-time operations.",
    accent: "green" as const,
    tags: ["MongoDB", "Redis"],
  },
  {
    icon: Server,
    title: "Microservice Architecture",
    description:
      "Dedicated execution service keeps code execution isolated from the collaboration backend for better scalability.",
    accent: "orange" as const,
    tags: ["NestJS", "Express"],
  },
  {
    icon: Layers3,
    title: "Modern Architecture",
    description:
      "Built with React, TypeScript, NestJS, Socket.IO, MediaSoup, Redis and Docker using scalable engineering practices.",
    accent: "cyan" as const,
    tags: ["React", "TypeScript", "Docker"],
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          badge="Core Features"
          title="Everything You Need for Collaborative Development"
          subtitle="CodeArenaX combines real-time collaboration, secure code execution, integrated communication, and scalable architecture into a unified developer workspace."
        />

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              accent={feature.accent}
              tags={feature.tags}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
