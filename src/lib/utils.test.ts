import { describe, it, expect, vi } from "vitest";
import { cn, downloadCSV } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });
});

describe("downloadCSV", () => {
  it("creates a CSV with correct headers and data", () => {
    // Mock URL.createObjectURL and document.createElement
    const mockClick = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:test",
      revokeObjectURL: mockRevokeObjectURL,
    });
    vi.spyOn(document, "createElement").mockImplementation(() => {
      return {
        href: "",
        download: "",
        click: mockClick,
      } as unknown as HTMLAnchorElement;
    });

    downloadCSV("test.csv", [
      { Name: "Alice", Age: "30" },
      { Name: "Bob", Age: "25" },
    ]);

    expect(mockClick).toHaveBeenCalled();
  });
});
