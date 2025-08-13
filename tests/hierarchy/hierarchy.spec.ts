import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { handleError } from "../handleError";
import { publishMetric } from "../../publishMetric/publishMetric";

export default function () {
  test("Hierarchy Page", async ({ page, request }) => {
    let total = 0;
    let passed = 0;
    let failed = 0;

    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    try {
      total++;
      await page.goto(`${USER_BASE_URL}/feed`);
      await expect(page).toHaveURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });
      passed++;

      total++;
      await page.locator("#menu-item").getByRole("button").click();
      await page.getByRole("link", { name: /hierarchy/i }).click();
      passed++;

      total++;
      await page.waitForSelector("#reset_zoom", { state: "visible" });
      await page.locator("#reset_zoom").click();
      passed++;

      total++;
      await page.waitForSelector("#zoom_in", { state: "visible" });
      await page.locator("#zoom_in").click();
      passed++;

      total++;
      await page.waitForSelector("#zoom_out", { state: "visible" });
      await page.locator("#zoom_out").click();
      passed++;

      total++;
      await expect(page).toHaveURL(`${USER_BASE_URL}/hierarchy`);
      passed++;
    } catch (err: any) {
      failed++;
      await handleError("Hierarchy test failed", {
        errorMessage: err.message || "Unknown error",
        stack: err.stack,
        pageUrl: page.url(),
      });
      throw err;
    } finally {
      try {
        await publishMetric(
          total,
          passed,
          failed,
          "Hierarchy Page Tests"
        );
        console.log(
          `Published metrics: Total=${total}, Passed=${passed}, Failed=${failed}`
        );
      } catch (error) {
        console.error("Error publishing metrics:", error);
      }
    }
  });
}
