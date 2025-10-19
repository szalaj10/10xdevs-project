import type { SupabaseClient } from "../../db/supabase.client";

/**
 * RulesBuilderService - Service for generating AI rules content
 *
 * This service creates structured rules content for AI assistants based on
 * project context, tech stack, and coding standards.
 */

export interface RuleSection {
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
}

export interface RulesConfig {
  projectName: string;
  techStack: string[];
  codingStandards?: string[];
  maxSections?: number;
  includeExamples?: boolean;
}

export interface GeneratedRules {
  sections: RuleSection[];
  metadata: {
    generatedAt: string;
    totalSections: number;
    techStackCount: number;
  };
}

/**
 * Validates rules configuration
 *
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config: RulesConfig): void {
  // Validate project name
  if (!config.projectName || config.projectName.trim().length === 0) {
    throw new Error("Project name is required");
  }

  if (config.projectName.length > 100) {
    throw new Error("Project name must not exceed 100 characters");
  }

  // Validate tech stack
  if (!config.techStack || !Array.isArray(config.techStack)) {
    throw new Error("Tech stack must be an array");
  }

  if (config.techStack.length === 0) {
    throw new Error("Tech stack must contain at least one technology");
  }

  if (config.techStack.length > 20) {
    throw new Error("Tech stack must not exceed 20 technologies");
  }

  // Validate each tech stack item
  for (const tech of config.techStack) {
    if (typeof tech !== "string" || tech.trim().length === 0) {
      throw new Error("Each tech stack item must be a non-empty string");
    }
  }

  // Validate coding standards
  if (config.codingStandards !== undefined) {
    if (!Array.isArray(config.codingStandards)) {
      throw new Error("Coding standards must be an array");
    }

    if (config.codingStandards.length > 50) {
      throw new Error("Coding standards must not exceed 50 items");
    }
  }

  // Validate maxSections
  if (config.maxSections !== undefined) {
    if (typeof config.maxSections !== "number" || config.maxSections < 1) {
      throw new Error("maxSections must be a positive number");
    }

    if (config.maxSections > 100) {
      throw new Error("maxSections must not exceed 100");
    }
  }
}

/**
 * Sanitizes text input to prevent injection attacks
 *
 * @param input - Text to sanitize
 * @returns Sanitized text
 */
function sanitizeText(input: string): string {
  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  const maxLength = 10000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Generates rule sections based on tech stack
 *
 * @param techStack - Array of technologies
 * @param includeExamples - Whether to include code examples
 * @returns Array of rule sections
 */
function generateTechStackSections(techStack: string[], includeExamples: boolean): RuleSection[] {
  const sections: RuleSection[] = [];

  // Map of tech to priority
  const priorityMap: Record<string, "high" | "medium" | "low"> = {
    typescript: "high",
    react: "high",
    astro: "high",
    nodejs: "high",
    tailwind: "medium",
    vitest: "medium",
    playwright: "medium",
    supabase: "high",
  };

  for (const tech of techStack) {
    const normalizedTech = tech.toLowerCase().trim();
    const priority = priorityMap[normalizedTech] || "low";

    let content = `Guidelines for ${tech}:\n`;

    // Add specific guidelines based on tech
    if (normalizedTech === "typescript") {
      content += "- Use strict type checking\n";
      content += "- Prefer interfaces over types for object shapes\n";
      content += "- Use const assertions where appropriate\n";
    } else if (normalizedTech === "react") {
      content += "- Use functional components with hooks\n";
      content += "- Implement proper error boundaries\n";
      content += "- Follow React best practices\n";
    } else if (normalizedTech === "astro") {
      content += "- Leverage server-side rendering\n";
      content += "- Use content collections for type safety\n";
      content += "- Implement proper middleware\n";
    } else {
      content += `- Follow ${tech} best practices\n`;
      content += `- Ensure proper ${tech} configuration\n`;
    }

    if (includeExamples) {
      content += `\nExample: See ${tech} documentation for details.\n`;
    }

    sections.push({
      title: tech,
      content: sanitizeText(content),
      priority,
    });
  }

  return sections;
}

/**
 * Generates rule sections based on coding standards
 *
 * @param standards - Array of coding standards
 * @returns Array of rule sections
 */
function generateCodingStandardsSections(standards: string[]): RuleSection[] {
  const sections: RuleSection[] = [];

  if (standards.length === 0) {
    return sections;
  }

  const content = standards.map((standard) => `- ${sanitizeText(standard)}`).join("\n");

  sections.push({
    title: "Coding Standards",
    content,
    priority: "high",
  });

  return sections;
}

/**
 * Generates rules content based on configuration
 *
 * @param config - Rules configuration
 * @returns Generated rules with metadata
 * @throws Error if configuration is invalid
 */
export function generateRulesContent(config: RulesConfig): GeneratedRules {
  // Validate configuration
  validateConfig(config);

  // Sanitize project name
  const projectName = sanitizeText(config.projectName);

  // Generate sections
  let sections: RuleSection[] = [];

  // Add project overview section
  sections.push({
    title: "Project Overview",
    content: `Project: ${projectName}\nTech Stack: ${config.techStack.join(", ")}`,
    priority: "high",
  });

  // Add tech stack sections
  const techSections = generateTechStackSections(config.techStack, config.includeExamples ?? false);
  sections = sections.concat(techSections);

  // Add coding standards sections
  if (config.codingStandards && config.codingStandards.length > 0) {
    const standardsSections = generateCodingStandardsSections(config.codingStandards);
    sections = sections.concat(standardsSections);
  }

  // Sort by priority (high > medium > low)
  sections.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Apply maxSections limit
  if (config.maxSections && sections.length > config.maxSections) {
    sections = sections.slice(0, config.maxSections);
  }

  // Generate metadata
  const metadata = {
    generatedAt: new Date().toISOString(),
    totalSections: sections.length,
    techStackCount: config.techStack.length,
  };

  return {
    sections,
    metadata,
  };
}

/**
 * Exports rules content to markdown format
 *
 * @param rules - Generated rules
 * @returns Markdown formatted string
 */
export function exportToMarkdown(rules: GeneratedRules): string {
  let markdown = `# AI Rules\n\n`;
  markdown += `*Generated at: ${rules.metadata.generatedAt}*\n\n`;
  markdown += `---\n\n`;

  for (const section of rules.sections) {
    markdown += `## ${section.title}\n\n`;
    markdown += `**Priority:** ${section.priority}\n\n`;
    markdown += `${section.content}\n\n`;
    markdown += `---\n\n`;
  }

  return markdown;
}

/**
 * RulesBuilderService class for database integration
 */
export class RulesBuilderService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Saves generated rules to database
   *
   * @param userId - User ID
   * @param rules - Generated rules
   * @returns Saved rules ID
   */
  async saveRules(userId: string, rules: GeneratedRules): Promise<number> {
    const { data, error } = await this.supabase
      .from("ai_rules")
      .insert({
        user_id: userId,
        content: JSON.stringify(rules),
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to save rules: ${error?.message || "Unknown error"}`);
    }

    return data.id;
  }

  /**
   * Retrieves rules from database
   *
   * @param userId - User ID
   * @param rulesId - Rules ID
   * @returns Generated rules
   */
  async getRules(userId: string, rulesId: number): Promise<GeneratedRules> {
    const { data, error } = await this.supabase
      .from("ai_rules")
      .select("content")
      .eq("id", rulesId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new Error("Rules not found");
    }

    return JSON.parse(data.content) as GeneratedRules;
  }
}
