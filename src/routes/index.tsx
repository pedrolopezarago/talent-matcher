import { createFileRoute } from "@tanstack/react-router";
import App from "@/talent/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Talent Matcher — Find the right team" },
      { name: "description", content: "Describe a project; we extract role requirements and match people with verified evidence." },
      { property: "og:title", content: "AI Talent Matcher — Find the right team" },
      { property: "og:description", content: "Describe a project; we extract role requirements and match people with verified evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <App />,
});
