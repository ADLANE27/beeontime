import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

describe("Card Components", () => {
  describe("Card", () => {
    it("renders children correctly", () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

  it("applies custom className", () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass("custom-class");
  });
  });

  describe("CardHeader", () => {
    it("renders header content", () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });
  });

  describe("CardTitle", () => {
    it("renders as h3 element", () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toHaveTextContent("Title");
    });
  });

  describe("CardDescription", () => {
    it("renders description text", () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText("Description text")).toBeInTheDocument();
    });
  });

  describe("CardContent", () => {
    it("renders content correctly", () => {
      render(<CardContent>Main content</CardContent>);
      expect(screen.getByText("Main content")).toBeInTheDocument();
    });
  });

  describe("CardFooter", () => {
    it("renders footer content", () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });
  });

  describe("Full Card composition", () => {
    it("renders all card parts together", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );

      expect(screen.getByRole("heading", { name: /test title/i })).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.getByText("Test Footer")).toBeInTheDocument();
    });
  });
});
