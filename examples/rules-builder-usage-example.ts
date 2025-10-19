/**
 * RulesBuilderService - Przykłady użycia
 *
 * Ten plik zawiera praktyczne przykłady użycia RulesBuilderService
 * do generowania reguł AI dla projektów.
 */

import {
  generateRulesContent,
  exportToMarkdown,
  RulesBuilderService,
  type RulesConfig,
} from "../src/lib/services/rulesBuilderService";
import { createSupabaseClient } from "../src/db/supabase.client";

// ============================================================================
// PRZYKŁAD 1: Minimalna konfiguracja
// ============================================================================

function example1_MinimalConfig() {
  const config: RulesConfig = {
    projectName: "My Flashcard App",
    techStack: ["TypeScript", "React", "Astro"],
  };

  const rules = generateRulesContent(config);

  console.log("📋 Generated sections:", rules.sections.length);
  console.log("🏷️ Tech stack count:", rules.metadata.techStackCount);
  console.log("⏰ Generated at:", rules.metadata.generatedAt);

  // Output:
  // 📋 Generated sections: 4
  // 🏷️ Tech stack count: 3
  // ⏰ Generated at: 2024-01-01T00:00:00.000Z
}

// ============================================================================
// PRZYKŁAD 2: Pełna konfiguracja z przykładami
// ============================================================================

function example2_FullConfig() {
  const config: RulesConfig = {
    projectName: "10xDevs Flashcard Project",
    techStack: ["TypeScript", "React", "Astro", "Tailwind", "Supabase", "Vitest"],
    codingStandards: [
      "Use strict type checking",
      "Follow ESLint rules",
      "Implement error boundaries",
      "Use early returns for error conditions",
      "Handle edge cases at function start",
    ],
    includeExamples: true,
    maxSections: 10,
  };

  const rules = generateRulesContent(config);

  console.log("📋 Sections:");
  rules.sections.forEach((section, index) => {
    console.log(`  ${index + 1}. ${section.title} [${section.priority}]`);
  });

  // Output:
  // 📋 Sections:
  //   1. Project Overview [high]
  //   2. TypeScript [high]
  //   3. React [high]
  //   4. Astro [high]
  //   5. Supabase [high]
  //   6. Coding Standards [high]
  //   7. Tailwind [medium]
  //   8. Vitest [medium]
}

// ============================================================================
// PRZYKŁAD 3: Export do Markdown
// ============================================================================

function example3_ExportToMarkdown() {
  const config: RulesConfig = {
    projectName: "AI Rules Generator",
    techStack: ["TypeScript", "Node.js"],
    codingStandards: ["Use async/await", "Handle errors properly"],
  };

  const rules = generateRulesContent(config);
  const markdown = exportToMarkdown(rules);

  console.log(markdown);

  // Output:
  // # AI Rules
  //
  // *Generated at: 2024-01-01T00:00:00.000Z*
  //
  // ---
  //
  // ## Project Overview
  //
  // **Priority:** high
  //
  // Project: AI Rules Generator
  // Tech Stack: TypeScript, Node.js
  //
  // ---
  //
  // ## TypeScript
  //
  // **Priority:** high
  //
  // Guidelines for TypeScript:
  // - Use strict type checking
  // ...
}

// ============================================================================
// PRZYKŁAD 4: Zapisywanie do bazy danych
// ============================================================================

async function example4_SaveToDatabase() {
  const supabase = createSupabaseClient();
  const service = new RulesBuilderService(supabase);

  const config: RulesConfig = {
    projectName: "Production App",
    techStack: ["TypeScript", "React", "PostgreSQL"],
  };

  const rules = generateRulesContent(config);

  try {
    const rulesId = await service.saveRules("user-123", rules);
    console.log("✅ Rules saved with ID:", rulesId);

    // Odczyt z bazy
    const savedRules = await service.getRules("user-123", rulesId);
    console.log("📖 Retrieved rules:", savedRules.sections.length, "sections");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ============================================================================
// PRZYKŁAD 5: Walidacja błędów
// ============================================================================

function example5_ErrorHandling() {
  // ❌ Błąd: pusta nazwa projektu
  try {
    const config: RulesConfig = {
      projectName: "",
      techStack: ["TypeScript"],
    };
    generateRulesContent(config);
  } catch (error) {
    console.error("Error:", (error as Error).message);
    // Output: Error: Project name is required
  }

  // ❌ Błąd: pusty tech stack
  try {
    const config: RulesConfig = {
      projectName: "Test",
      techStack: [],
    };
    generateRulesContent(config);
  } catch (error) {
    console.error("Error:", (error as Error).message);
    // Output: Error: Tech stack must contain at least one technology
  }

  // ❌ Błąd: za długa nazwa
  try {
    const config: RulesConfig = {
      projectName: "a".repeat(101),
      techStack: ["TypeScript"],
    };
    generateRulesContent(config);
  } catch (error) {
    console.error("Error:", (error as Error).message);
    // Output: Error: Project name must not exceed 100 characters
  }

  // ✅ Poprawna konfiguracja
  const validConfig: RulesConfig = {
    projectName: "Valid Project",
    techStack: ["TypeScript"],
  };
  const rules = generateRulesContent(validConfig);
  console.log("✅ Success:", rules.sections.length, "sections");
}

// ============================================================================
// PRZYKŁAD 6: Limitowanie sekcji
// ============================================================================

function example6_LimitSections() {
  const config: RulesConfig = {
    projectName: "Large Project",
    techStack: [
      "TypeScript", // high
      "React", // high
      "Astro", // high
      "Tailwind", // medium
      "Vitest", // medium
      "UnknownTech1", // low
      "UnknownTech2", // low
    ],
    maxSections: 5, // Limit to 5 sections
  };

  const rules = generateRulesContent(config);

  console.log("📋 Limited to", rules.metadata.totalSections, "sections:");
  rules.sections.forEach((section) => {
    console.log(`  - ${section.title} [${section.priority}]`);
  });

  // Output (high priority first):
  // 📋 Limited to 5 sections:
  //   - Project Overview [high]
  //   - TypeScript [high]
  //   - React [high]
  //   - Astro [high]
  //   - Tailwind [medium]
}

// ============================================================================
// PRZYKŁAD 7: Tech-specific guidelines
// ============================================================================

function example7_TechSpecificGuidelines() {
  const config: RulesConfig = {
    projectName: "Test",
    techStack: ["TypeScript", "React", "Astro"],
  };

  const rules = generateRulesContent(config);

  // TypeScript guidelines
  const tsSection = rules.sections.find((s) => s.title === "TypeScript");
  console.log("📘 TypeScript guidelines:");
  console.log(tsSection?.content);
  // Output:
  // Guidelines for TypeScript:
  // - Use strict type checking
  // - Prefer interfaces over types for object shapes
  // - Use const assertions where appropriate

  // React guidelines
  const reactSection = rules.sections.find((s) => s.title === "React");
  console.log("\n⚛️ React guidelines:");
  console.log(reactSection?.content);
  // Output:
  // Guidelines for React:
  // - Use functional components with hooks
  // - Implement proper error boundaries
  // - Follow React best practices

  // Astro guidelines
  const astroSection = rules.sections.find((s) => s.title === "Astro");
  console.log("\n🚀 Astro guidelines:");
  console.log(astroSection?.content);
  // Output:
  // Guidelines for Astro:
  // - Leverage server-side rendering
  // - Use content collections for type safety
  // - Implement proper middleware
}

// ============================================================================
// PRZYKŁAD 8: Priority system
// ============================================================================

function example8_PrioritySystem() {
  const config: RulesConfig = {
    projectName: "Priority Demo",
    techStack: [
      "UnknownFramework", // low
      "Tailwind", // medium
      "TypeScript", // high
      "CustomLib", // low
      "Vitest", // medium
      "React", // high
    ],
  };

  const rules = generateRulesContent(config);

  console.log("🎯 Sections sorted by priority:");
  rules.sections.forEach((section, index) => {
    const emoji = section.priority === "high" ? "🔴" : section.priority === "medium" ? "🟡" : "🟢";
    console.log(`  ${index + 1}. ${emoji} ${section.title} [${section.priority}]`);
  });

  // Output:
  // 🎯 Sections sorted by priority:
  //   1. 🔴 Project Overview [high]
  //   2. 🔴 TypeScript [high]
  //   3. 🔴 React [high]
  //   4. 🟡 Tailwind [medium]
  //   5. 🟡 Vitest [medium]
  //   6. 🟢 UnknownFramework [low]
  //   7. 🟢 CustomLib [low]
}

// ============================================================================
// PRZYKŁAD 9: Unicode i znaki specjalne
// ============================================================================

function example9_UnicodeSupport() {
  const config: RulesConfig = {
    projectName: "Projekt Testowy 🚀 (2024)",
    techStack: ["TypeScript", "React"],
    codingStandards: ["Używaj polskich komentarzy 📝", "Testuj edge cases ✅"],
  };

  const rules = generateRulesContent(config);

  const overview = rules.sections.find((s) => s.title === "Project Overview");
  console.log("🌍 Unicode support:");
  console.log(overview?.content);

  const standards = rules.sections.find((s) => s.title === "Coding Standards");
  console.log("\n📋 Standards:");
  console.log(standards?.content);

  // Output:
  // 🌍 Unicode support:
  // Project: Projekt Testowy 🚀 (2024)
  // Tech Stack: TypeScript, React
  //
  // 📋 Standards:
  // - Używaj polskich komentarzy 📝
  // - Testuj edge cases ✅
}

// ============================================================================
// PRZYKŁAD 10: Integration with AI prompts
// ============================================================================

function example10_AIIntegration() {
  const config: RulesConfig = {
    projectName: "10xDevs Flashcard App",
    techStack: ["Astro", "TypeScript", "React", "Supabase", "Tailwind"],
    codingStandards: [
      "Use Supabase from context.locals in Astro routes",
      "Implement proper error handling with early returns",
      "Follow spaced repetition algorithm for flashcards",
      "Use Zod schemas for API validation",
    ],
    includeExamples: true,
    maxSections: 15,
  };

  const rules = generateRulesContent(config);
  const markdown = exportToMarkdown(rules);

  // Save to file for AI assistant
  console.log("💾 Saving rules to .cursor/rules/ai-rules.md");
  console.log(`📊 Generated ${rules.metadata.totalSections} sections`);
  console.log(`🏷️ Tech stack: ${rules.metadata.techStackCount} technologies`);

  // Use in AI prompt
  const aiPrompt = `
You are an AI assistant working on the ${config.projectName} project.

Follow these rules:

${markdown}

Now help me implement a new feature...
  `;

  console.log("\n🤖 AI Prompt ready!");
  console.log(`📝 Prompt length: ${aiPrompt.length} characters`);
}

// ============================================================================
// Uruchomienie przykładów
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 RulesBuilderService - Przykłady użycia\n");
  console.log("=".repeat(80));

  console.log("\n📌 PRZYKŁAD 1: Minimalna konfiguracja");
  console.log("-".repeat(80));
  example1_MinimalConfig();

  console.log("\n📌 PRZYKŁAD 2: Pełna konfiguracja");
  console.log("-".repeat(80));
  example2_FullConfig();

  console.log("\n📌 PRZYKŁAD 3: Export do Markdown");
  console.log("-".repeat(80));
  example3_ExportToMarkdown();

  console.log("\n📌 PRZYKŁAD 5: Obsługa błędów");
  console.log("-".repeat(80));
  example5_ErrorHandling();

  console.log("\n📌 PRZYKŁAD 6: Limitowanie sekcji");
  console.log("-".repeat(80));
  example6_LimitSections();

  console.log("\n📌 PRZYKŁAD 7: Tech-specific guidelines");
  console.log("-".repeat(80));
  example7_TechSpecificGuidelines();

  console.log("\n📌 PRZYKŁAD 8: System priorytetów");
  console.log("-".repeat(80));
  example8_PrioritySystem();

  console.log("\n📌 PRZYKŁAD 9: Unicode i znaki specjalne");
  console.log("-".repeat(80));
  example9_UnicodeSupport();

  console.log("\n📌 PRZYKŁAD 10: Integracja z AI");
  console.log("-".repeat(80));
  example10_AIIntegration();

  console.log("\n" + "=".repeat(80));
  console.log("✅ Wszystkie przykłady wykonane!");
}

export {
  example1_MinimalConfig,
  example2_FullConfig,
  example3_ExportToMarkdown,
  example4_SaveToDatabase,
  example5_ErrorHandling,
  example6_LimitSections,
  example7_TechSpecificGuidelines,
  example8_PrioritySystem,
  example9_UnicodeSupport,
  example10_AIIntegration,
};
