import { createFileRoute } from "@tanstack/react-router";
import App from "@/talent/App";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "TalentIn — Demo" },
      { name: "description", content: "A seeded demo of matched candidates and evidence for a sample project brief." },
      { property: "og:title", content: "TalentIn — Demo" },
      { property: "og:description", content: "A seeded demo of matched candidates and evidence for a sample project brief." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <App isDemo />,
});
