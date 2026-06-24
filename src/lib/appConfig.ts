import type { AppConfig } from "./types";

// NOTE: The backend spec does not expose an app-config endpoint, so branding,
// suggestion chips, tagline, supported languages and version are static
// frontend config. Edit values here as needed.
export const APP_CONFIG: AppConfig = {
  name: "Tata Motors",
  logo_url:
    "https://www.tatamotors.com/wp-content/themes/tatamotors/images/tata-logo.png",
  tagline: "Apni boli mein baat karo",
  suggestion_chips: [
    "Nearest Tata service center?",
    "Tell me about Nexon EV",
    "Book a test drive",
  ],
  supported_langs: ["hi", "en", "mr"],
  version: "1.0.0",
};
