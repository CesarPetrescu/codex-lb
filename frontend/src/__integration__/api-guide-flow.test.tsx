import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/App";
import { renderWithProviders } from "@/test/utils";

describe("api guide integration", () => {
  it("renders the API guide route", async () => {
    window.history.pushState({}, "", "/api-guide");
    renderWithProviders(<App />);

    expect(await screen.findByRole("heading", { name: "API Guide" })).toBeInTheDocument();
    expect(screen.getByText("Coverage")).toBeInTheDocument();
    expect(screen.getByText("Upload auth.json")).toBeInTheDocument();
    expect(screen.getByText("Enable API Key Auth")).toBeInTheDocument();
    expect(screen.getByText("Create API key (allowed models + token/cost limits)")).toBeInTheDocument();
    expect(screen.getByText("Modify usage policy in detail")).toBeInTheDocument();
    expect(screen.getByText("See per-key usage and price counters")).toBeInTheDocument();
  });
});
