import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateRulesContent,
  exportToMarkdown,
  RulesBuilderService,
  type RulesConfig,
  type GeneratedRules,
} from "@/lib/services/rulesBuilderService";
import type { SupabaseClient } from "@/db/supabase.client";

describe("RulesBuilderService", () => {
  describe("generateRulesContent", () => {
    describe("Configuration Validation", () => {
      it("should throw error when project name is empty", () => {
        const config: RulesConfig = {
          projectName: "",
          techStack: ["TypeScript"],
        };

        expect(() => generateRulesContent(config)).toThrow("Project name is required");
      });

      it("should throw error when project name is only whitespace", () => {
        const config: RulesConfig = {
          projectName: "   ",
          techStack: ["TypeScript"],
        };

        expect(() => generateRulesContent(config)).toThrow("Project name is required");
      });

      it("should throw error when project name exceeds 100 characters", () => {
        const config: RulesConfig = {
          projectName: "a".repeat(101),
          techStack: ["TypeScript"],
        };

        expect(() => generateRulesContent(config)).toThrow("Project name must not exceed 100 characters");
      });

      it("should accept project name with exactly 100 characters", () => {
        const config: RulesConfig = {
          projectName: "a".repeat(100),
          techStack: ["TypeScript"],
        };

        expect(() => generateRulesContent(config)).not.toThrow();
      });

      it("should throw error when tech stack is not an array", () => {
        const config = {
          projectName: "Test Project",
          techStack: "TypeScript" as unknown as string[],
        };

        expect(() => generateRulesContent(config)).toThrow("Tech stack must be an array");
      });

      it("should throw error when tech stack is empty", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: [],
        };

        expect(() => generateRulesContent(config)).toThrow("Tech stack must contain at least one technology");
      });

      it("should throw error when tech stack exceeds 20 technologies", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: Array(21).fill("Tech"),
        };

        expect(() => generateRulesContent(config)).toThrow("Tech stack must not exceed 20 technologies");
      });

      it("should accept tech stack with exactly 20 technologies", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: Array(20).fill("Tech"),
        };

        expect(() => generateRulesContent(config)).not.toThrow();
      });

      it("should throw error when tech stack contains empty string", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: ["TypeScript", "", "React"],
        };

        expect(() => generateRulesContent(config)).toThrow("Each tech stack item must be a non-empty string");
      });

      it("should throw error when tech stack contains non-string", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: ["TypeScript", 123 as unknown as string],
        };

        expect(() => generateRulesContent(config)).toThrow("Each tech stack item must be a non-empty string");
      });

      it("should throw error when coding standards is not an array", () => {
        const config = {
          projectName: "Test Project",
          techStack: ["TypeScript"],
          codingStandards: "Use strict mode" as unknown as string[],
        };

        expect(() => generateRulesContent(config)).toThrow("Coding standards must be an array");
      });

      it("should throw error when coding standards exceeds 50 items", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: ["TypeScript"],
          codingStandards: Array(51).fill("Standard"),
        };

        expect(() => generateRulesContent(config)).toThrow("Coding standards must not exceed 50 items");
      });

      it("should throw error when maxSections is not a number", () => {
        const config = {
          projectName: "Test Project",
          techStack: ["TypeScript"],
          maxSections: "10" as unknown as number,
        };

        expect(() => generateRulesContent(config)).toThrow("maxSections must be a positive number");
      });

      it("should throw error when maxSections is zero", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: ["TypeScript"],
          maxSections: 0,
        };

        expect(() => generateRulesContent(config)).toThrow("maxSections must be a positive number");
      });

      it("should throw error when maxSections is negative", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: ["TypeScript"],
          maxSections: -5,
        };

        expect(() => generateRulesContent(config)).toThrow("maxSections must be a positive number");
      });

      it("should throw error when maxSections exceeds 100", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: ["TypeScript"],
          maxSections: 101,
        };

        expect(() => generateRulesContent(config)).toThrow("maxSections must not exceed 100");
      });
    });

    describe("Basic Functionality", () => {
      it("should generate rules with minimal configuration", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);

        expect(result).toBeDefined();
        expect(result.sections).toBeInstanceOf(Array);
        expect(result.metadata).toBeDefined();
      });

      it("should include project overview section", () => {
        const config: RulesConfig = {
          projectName: "My Awesome Project",
          techStack: ["TypeScript", "React"],
        };

        const result = generateRulesContent(config);

        const overviewSection = result.sections.find((s) => s.title === "Project Overview");
        expect(overviewSection).toBeDefined();
        expect(overviewSection?.content).toContain("My Awesome Project");
        expect(overviewSection?.content).toContain("TypeScript, React");
        expect(overviewSection?.priority).toBe("high");
      });

      it("should generate section for each tech stack item", () => {
        const config: RulesConfig = {
          projectName: "Test Project",
          techStack: ["TypeScript", "React", "Astro"],
        };

        const result = generateRulesContent(config);

        // Should have: Project Overview + 3 tech sections = 4 total
        expect(result.sections.length).toBeGreaterThanOrEqual(4);

        const techSections = result.sections.filter((s) => ["TypeScript", "React", "Astro"].includes(s.title));
        expect(techSections).toHaveLength(3);
      });

      it("should trim whitespace from project name", () => {
        const config: RulesConfig = {
          projectName: "  Test Project  ",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const overviewSection = result.sections.find((s) => s.title === "Project Overview");

        expect(overviewSection?.content).toContain("Test Project");
        expect(overviewSection?.content).not.toMatch(/^\s+Test Project/);
        expect(overviewSection?.content).not.toMatch(/Test Project\s+$/);
      });
    });

    describe("Tech Stack Priority Rules", () => {
      it("should assign high priority to TypeScript", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const tsSection = result.sections.find((s) => s.title === "TypeScript");

        expect(tsSection?.priority).toBe("high");
      });

      it("should assign high priority to React", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["React"],
        };

        const result = generateRulesContent(config);
        const reactSection = result.sections.find((s) => s.title === "React");

        expect(reactSection?.priority).toBe("high");
      });

      it("should assign high priority to Astro", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["Astro"],
        };

        const result = generateRulesContent(config);
        const astroSection = result.sections.find((s) => s.title === "Astro");

        expect(astroSection?.priority).toBe("high");
      });

      it("should assign medium priority to Tailwind", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["Tailwind"],
        };

        const result = generateRulesContent(config);
        const tailwindSection = result.sections.find((s) => s.title === "Tailwind");

        expect(tailwindSection?.priority).toBe("medium");
      });

      it("should assign low priority to unknown technologies", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["UnknownTech"],
        };

        const result = generateRulesContent(config);
        const unknownSection = result.sections.find((s) => s.title === "UnknownTech");

        expect(unknownSection?.priority).toBe("low");
      });

      it("should be case-insensitive for priority assignment", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["typescript", "REACT", "AsTrO"],
        };

        const result = generateRulesContent(config);

        const tsSection = result.sections.find((s) => s.title === "typescript");
        const reactSection = result.sections.find((s) => s.title === "REACT");
        const astroSection = result.sections.find((s) => s.title === "AsTrO");

        expect(tsSection?.priority).toBe("high");
        expect(reactSection?.priority).toBe("high");
        expect(astroSection?.priority).toBe("high");
      });
    });

    describe("Tech-Specific Guidelines", () => {
      it("should include TypeScript-specific guidelines", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const tsSection = result.sections.find((s) => s.title === "TypeScript");

        expect(tsSection?.content).toContain("strict type checking");
        expect(tsSection?.content).toContain("interfaces over types");
        expect(tsSection?.content).toContain("const assertions");
      });

      it("should include React-specific guidelines", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["React"],
        };

        const result = generateRulesContent(config);
        const reactSection = result.sections.find((s) => s.title === "React");

        expect(reactSection?.content).toContain("functional components");
        expect(reactSection?.content).toContain("error boundaries");
        expect(reactSection?.content).toContain("best practices");
      });

      it("should include Astro-specific guidelines", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["Astro"],
        };

        const result = generateRulesContent(config);
        const astroSection = result.sections.find((s) => s.title === "Astro");

        expect(astroSection?.content).toContain("server-side rendering");
        expect(astroSection?.content).toContain("content collections");
        expect(astroSection?.content).toContain("middleware");
      });

      it("should include generic guidelines for unknown tech", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["CustomFramework"],
        };

        const result = generateRulesContent(config);
        const customSection = result.sections.find((s) => s.title === "CustomFramework");

        expect(customSection?.content).toContain("best practices");
        expect(customSection?.content).toContain("configuration");
      });
    });

    describe("Code Examples", () => {
      it("should not include examples by default", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const tsSection = result.sections.find((s) => s.title === "TypeScript");

        expect(tsSection?.content).not.toContain("Example:");
      });

      it("should include examples when includeExamples is true", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
          includeExamples: true,
        };

        const result = generateRulesContent(config);
        const tsSection = result.sections.find((s) => s.title === "TypeScript");

        expect(tsSection?.content).toContain("Example:");
        expect(tsSection?.content).toContain("documentation");
      });

      it("should not include examples when includeExamples is false", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["React"],
          includeExamples: false,
        };

        const result = generateRulesContent(config);
        const reactSection = result.sections.find((s) => s.title === "React");

        expect(reactSection?.content).not.toContain("Example:");
      });
    });

    describe("Coding Standards", () => {
      it("should not include coding standards section when not provided", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const standardsSection = result.sections.find((s) => s.title === "Coding Standards");

        expect(standardsSection).toBeUndefined();
      });

      it("should not include coding standards section when empty array", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
          codingStandards: [],
        };

        const result = generateRulesContent(config);
        const standardsSection = result.sections.find((s) => s.title === "Coding Standards");

        expect(standardsSection).toBeUndefined();
      });

      it("should include coding standards section when provided", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
          codingStandards: ["Use strict mode", "Follow ESLint rules"],
        };

        const result = generateRulesContent(config);
        const standardsSection = result.sections.find((s) => s.title === "Coding Standards");

        expect(standardsSection).toBeDefined();
        expect(standardsSection?.priority).toBe("high");
      });

      it("should format coding standards as bullet list", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
          codingStandards: ["Standard 1", "Standard 2", "Standard 3"],
        };

        const result = generateRulesContent(config);
        const standardsSection = result.sections.find((s) => s.title === "Coding Standards");

        expect(standardsSection?.content).toContain("- Standard 1");
        expect(standardsSection?.content).toContain("- Standard 2");
        expect(standardsSection?.content).toContain("- Standard 3");
      });
    });

    describe("Priority Sorting", () => {
      it("should sort sections by priority (high > medium > low)", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["UnknownTech", "Tailwind", "TypeScript"], // low, medium, high
        };

        const result = generateRulesContent(config);

        // Find indices
        const highPriorityIndex = result.sections.findIndex((s) => s.priority === "high");
        const mediumPriorityIndex = result.sections.findIndex((s) => s.priority === "medium");
        const lowPriorityIndex = result.sections.findIndex((s) => s.priority === "low");

        // High should come before medium
        if (highPriorityIndex !== -1 && mediumPriorityIndex !== -1) {
          expect(highPriorityIndex).toBeLessThan(mediumPriorityIndex);
        }

        // Medium should come before low
        if (mediumPriorityIndex !== -1 && lowPriorityIndex !== -1) {
          expect(mediumPriorityIndex).toBeLessThan(lowPriorityIndex);
        }
      });

      it("should place Project Overview first (high priority)", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript", "React"],
        };

        const result = generateRulesContent(config);

        expect(result.sections[0].title).toBe("Project Overview");
        expect(result.sections[0].priority).toBe("high");
      });
    });

    describe("maxSections Limit", () => {
      it("should not limit sections when maxSections is not provided", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["Tech1", "Tech2", "Tech3", "Tech4", "Tech5"],
        };

        const result = generateRulesContent(config);

        // Should have at least 6 sections (1 overview + 5 tech)
        expect(result.sections.length).toBeGreaterThanOrEqual(6);
      });

      it("should limit sections to maxSections value", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["Tech1", "Tech2", "Tech3", "Tech4", "Tech5"],
          maxSections: 3,
        };

        const result = generateRulesContent(config);

        expect(result.sections.length).toBe(3);
      });

      it("should keep highest priority sections when limiting", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript", "React", "UnknownTech1", "UnknownTech2"],
          maxSections: 3,
        };

        const result = generateRulesContent(config);

        expect(result.sections.length).toBe(3);

        // Should keep high priority sections
        const titles = result.sections.map((s) => s.title);
        expect(titles).toContain("Project Overview");
        expect(titles).toContain("TypeScript");
        expect(titles).toContain("React");
      });

      it("should not fail when maxSections is larger than total sections", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
          maxSections: 100,
        };

        const result = generateRulesContent(config);

        // Should have 2 sections (overview + TypeScript)
        expect(result.sections.length).toBe(2);
      });
    });

    describe("Metadata Generation", () => {
      it("should include generatedAt timestamp", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);

        expect(result.metadata.generatedAt).toBeDefined();
        expect(typeof result.metadata.generatedAt).toBe("string");

        // Should be valid ISO date
        const date = new Date(result.metadata.generatedAt);
        expect(date.toString()).not.toBe("Invalid Date");
      });

      it("should include correct totalSections count", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript", "React"],
        };

        const result = generateRulesContent(config);

        expect(result.metadata.totalSections).toBe(result.sections.length);
      });

      it("should include correct techStackCount", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript", "React", "Astro"],
        };

        const result = generateRulesContent(config);

        expect(result.metadata.techStackCount).toBe(3);
      });

      it("should update totalSections when maxSections is applied", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["Tech1", "Tech2", "Tech3"],
          maxSections: 2,
        };

        const result = generateRulesContent(config);

        expect(result.metadata.totalSections).toBe(2);
        expect(result.sections.length).toBe(2);
      });
    });

    describe("Input Sanitization", () => {
      it("should remove control characters from project name", () => {
        const config: RulesConfig = {
          projectName: "Test\x00Project\x1F",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const overviewSection = result.sections.find((s) => s.title === "Project Overview");

        expect(overviewSection?.content).not.toContain("\x00");
        expect(overviewSection?.content).not.toContain("\x1F");
        expect(overviewSection?.content).toContain("TestProject");
      });

      it("should preserve newlines in content", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const tsSection = result.sections.find((s) => s.title === "TypeScript");

        // Content should have newlines from guidelines
        expect(tsSection?.content).toContain("\n");
      });

      it("should sanitize coding standards", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
          codingStandards: ["Standard\x00with\x1Fcontrol", "Normal standard"],
        };

        const result = generateRulesContent(config);
        const standardsSection = result.sections.find((s) => s.title === "Coding Standards");

        expect(standardsSection?.content).not.toContain("\x00");
        expect(standardsSection?.content).not.toContain("\x1F");
      });

      it("should truncate extremely long content", () => {
        const longStandard = "x".repeat(15000);
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript"],
          codingStandards: [longStandard],
        };

        const result = generateRulesContent(config);
        const standardsSection = result.sections.find((s) => s.title === "Coding Standards");

        // Content should be truncated (max 10000 chars per sanitizeText)
        expect(standardsSection?.content.length).toBeLessThanOrEqual(10010); // +10 for "- " prefix
      });
    });

    describe("Edge Cases", () => {
      it("should handle single character project name", () => {
        const config: RulesConfig = {
          projectName: "X",
          techStack: ["TypeScript"],
        };

        expect(() => generateRulesContent(config)).not.toThrow();
      });

      it("should handle special characters in project name", () => {
        const config: RulesConfig = {
          projectName: "Test-Project_2024!",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const overviewSection = result.sections.find((s) => s.title === "Project Overview");

        expect(overviewSection?.content).toContain("Test-Project_2024!");
      });

      it("should handle unicode characters in project name", () => {
        const config: RulesConfig = {
          projectName: "Projekt Testowy 🚀",
          techStack: ["TypeScript"],
        };

        const result = generateRulesContent(config);
        const overviewSection = result.sections.find((s) => s.title === "Project Overview");

        expect(overviewSection?.content).toContain("Projekt Testowy 🚀");
      });

      it("should handle tech stack with duplicate entries", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript", "TypeScript", "React"],
        };

        const result = generateRulesContent(config);

        // Should create section for each entry (even duplicates)
        const tsSections = result.sections.filter((s) => s.title === "TypeScript");
        expect(tsSections.length).toBe(2);
      });

      it("should handle maxSections of 1", () => {
        const config: RulesConfig = {
          projectName: "Test",
          techStack: ["TypeScript", "React"],
          maxSections: 1,
        };

        const result = generateRulesContent(config);

        expect(result.sections.length).toBe(1);
        expect(result.sections[0].priority).toBe("high");
      });
    });
  });

  describe("exportToMarkdown", () => {
    it("should export rules to markdown format", () => {
      const rules: GeneratedRules = {
        sections: [
          {
            title: "Test Section",
            content: "Test content",
            priority: "high",
          },
        ],
        metadata: {
          generatedAt: "2024-01-01T00:00:00.000Z",
          totalSections: 1,
          techStackCount: 1,
        },
      };

      const markdown = exportToMarkdown(rules);

      expect(markdown).toContain("# AI Rules");
      expect(markdown).toContain("2024-01-01T00:00:00.000Z");
      expect(markdown).toContain("## Test Section");
      expect(markdown).toContain("**Priority:** high");
      expect(markdown).toContain("Test content");
    });

    it("should include all sections in markdown", () => {
      const rules: GeneratedRules = {
        sections: [
          { title: "Section 1", content: "Content 1", priority: "high" },
          { title: "Section 2", content: "Content 2", priority: "medium" },
          { title: "Section 3", content: "Content 3", priority: "low" },
        ],
        metadata: {
          generatedAt: "2024-01-01T00:00:00.000Z",
          totalSections: 3,
          techStackCount: 2,
        },
      };

      const markdown = exportToMarkdown(rules);

      expect(markdown).toContain("## Section 1");
      expect(markdown).toContain("## Section 2");
      expect(markdown).toContain("## Section 3");
      expect(markdown).toContain("Content 1");
      expect(markdown).toContain("Content 2");
      expect(markdown).toContain("Content 3");
    });

    it("should separate sections with horizontal rules", () => {
      const rules: GeneratedRules = {
        sections: [
          { title: "Section 1", content: "Content 1", priority: "high" },
          { title: "Section 2", content: "Content 2", priority: "medium" },
        ],
        metadata: {
          generatedAt: "2024-01-01T00:00:00.000Z",
          totalSections: 2,
          techStackCount: 1,
        },
      };

      const markdown = exportToMarkdown(rules);

      // Should have horizontal rules (---)
      const hrCount = (markdown.match(/---/g) || []).length;
      expect(hrCount).toBeGreaterThanOrEqual(3); // Header + 2 sections
    });
  });

  describe("RulesBuilderService Class", () => {
    let mockSupabase: SupabaseClient;
    let service: RulesBuilderService;

    beforeEach(() => {
      // Create mock Supabase client
      mockSupabase = {
        from: vi.fn(),
      } as unknown as SupabaseClient;

      service = new RulesBuilderService(mockSupabase);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe("saveRules", () => {
      it("should save rules to database", async () => {
        const mockRules: GeneratedRules = {
          sections: [{ title: "Test", content: "Content", priority: "high" }],
          metadata: {
            generatedAt: "2024-01-01T00:00:00.000Z",
            totalSections: 1,
            techStackCount: 1,
          },
        };

        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 123 },
              error: null,
            }),
          }),
        });

        vi.mocked(mockSupabase.from).mockReturnValue({
          insert: mockInsert,
        } as ReturnType<typeof mockSupabase.from>);

        const result = await service.saveRules("user-123", mockRules);

        expect(result).toBe(123);
        expect(mockSupabase.from).toHaveBeenCalledWith("ai_rules");
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: "user-123",
            content: JSON.stringify(mockRules),
          })
        );
      });

      it("should throw error when save fails", async () => {
        const mockRules: GeneratedRules = {
          sections: [],
          metadata: {
            generatedAt: "2024-01-01T00:00:00.000Z",
            totalSections: 0,
            techStackCount: 0,
          },
        };

        const mockInsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        });

        vi.mocked(mockSupabase.from).mockReturnValue({
          insert: mockInsert,
        } as ReturnType<typeof mockSupabase.from>);

        await expect(service.saveRules("user-123", mockRules)).rejects.toThrow("Failed to save rules: Database error");
      });
    });

    describe("getRules", () => {
      it("should retrieve rules from database", async () => {
        const mockRules: GeneratedRules = {
          sections: [{ title: "Test", content: "Content", priority: "high" }],
          metadata: {
            generatedAt: "2024-01-01T00:00:00.000Z",
            totalSections: 1,
            techStackCount: 1,
          },
        };

        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { content: JSON.stringify(mockRules) },
                error: null,
              }),
            }),
          }),
        });

        vi.mocked(mockSupabase.from).mockReturnValue({
          select: mockSelect,
        } as ReturnType<typeof mockSupabase.from>);

        const result = await service.getRules("user-123", 456);

        expect(result).toEqual(mockRules);
        expect(mockSupabase.from).toHaveBeenCalledWith("ai_rules");
        expect(mockSelect).toHaveBeenCalledWith("content");
      });

      it("should throw error when rules not found", async () => {
        const mockSelect = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Not found" },
              }),
            }),
          }),
        });

        vi.mocked(mockSupabase.from).mockReturnValue({
          select: mockSelect,
        } as ReturnType<typeof mockSupabase.from>);

        await expect(service.getRules("user-123", 456)).rejects.toThrow("Rules not found");
      });
    });
  });
});
