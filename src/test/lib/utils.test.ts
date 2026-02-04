import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Utils", () => {
  describe("cn (classnames utility)", () => {
    it("merges class names correctly", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toBe("base active");
    });

    it("filters out falsy values", () => {
      const result = cn("base", false && "hidden", null, undefined, "visible");
      expect(result).toBe("base visible");
    });

    it("handles empty strings", () => {
      const result = cn("", "class1", "", "class2");
      expect(result).toBe("class1 class2");
    });

    it("merges tailwind classes correctly", () => {
      // tailwind-merge should deduplicate conflicting classes
      const result = cn("px-4", "px-8");
      expect(result).toBe("px-8");
    });

    it("handles objects", () => {
      const result = cn({ active: true, disabled: false });
      expect(result).toBe("active");
    });

    it("handles arrays", () => {
      const result = cn(["class1", "class2"]);
      expect(result).toBe("class1 class2");
    });
  });
});
