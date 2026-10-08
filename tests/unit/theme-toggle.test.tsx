import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import { THEME_STORAGE_KEY, themeInitScript } from "@/components/theme/theme";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import en from "@/messages/en.json";

function renderToggle() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ThemeToggle />
    </NextIntlClientProvider>,
  );
}

describe("ThemeToggle", () => {
  it("defaults to light and switches to dark, remembering the choice", async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole("button", { name: "Switch to dark theme" });
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(button);

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      await screen.findByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });

  it("restores a saved dark preference", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderToggle();
    expect(document.documentElement).toHaveClass("dark");
  });
});

describe("theme init script", () => {
  it("applies a saved dark theme before paint and ignores junk values", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(themeInitScript)();
    expect(document.documentElement).toHaveClass("dark");

    document.documentElement.className = "";
    localStorage.setItem(THEME_STORAGE_KEY, "<script>");
    new Function(themeInitScript)();
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
