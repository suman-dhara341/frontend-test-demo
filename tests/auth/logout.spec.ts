import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken } from "../authService/orgId_empId";
import { handleError } from "../handleError";
import { publishMetric } from "../../publishMetric/publishMetric";

export default function () {
  test("user can login and logout successfully", async ({ page, request }) => {
    let total = 0;
    let passed = 0;
    let failed = 0;

    await page.addInitScript(() => {
      localStorage.setItem("feedTour", "true");
      localStorage.setItem("anonymousFeedbackPlaywright", "true");
    });

    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;
    const email = process.env.TEST_USER_EMAIL ?? "";

    total++;
    try {
      await page.goto(`${USER_BASE_URL}/feed`);
      await expect(page).toHaveURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });
      passed++;
    } catch (err: any) {
      failed++;
      await handleError("Navigation to Feed page failed", {
        error: err.message,
      });
      throw err;
    }

    total++;
    try {
      await page.locator("#navbar_avatar").click();
      await page.getByRole("button", { name: "Log Out" }).click();
      passed++;
    } catch (err: any) {
      failed++;
      await handleError("UI logout interaction failed", { error: err.message });
      throw err;
    }

    const fcmToken = await page.evaluate(() => {
      return localStorage.getItem("fcmToken") || "";
    });

    total++;
    let logoutData;
    try {
      const logoutResponse = await request.post(
        `${API_BASE_URL}/auth/signout`,
        {
          data: {
            authToken: idToken,
            email: email,
            fcmToken,
          },
          headers: { "Content-Type": "application/json" },
        }
      );
      logoutData = await logoutResponse.json();
      passed++;
    } catch (err: any) {
      failed++;
      await handleError("Network/API call failed during logout", {
        error: err.message,
        endpoint: `${API_BASE_URL}/auth/signout`,
        idTokenPresent: !!idToken,
        email,
      });
      throw err;
    }

    total++;
    if (logoutData.status !== 200) {
      failed++;
      await handleError("Logout API returned failure response", {
        response: logoutData,
      });
      throw new Error(`Logout failed: ${JSON.stringify(logoutData, null, 2)}`);
    } else {
      passed++;
    }

    total++;
    try {
      expect(logoutData.status).toBe(200);
      expect(logoutData.message).toBe("Logout successful.");

      await expect(page).toHaveURL(`${USER_BASE_URL}/login`);
      await page
        .locator("text=Email Address")
        .waitFor({ state: "visible", timeout: 80000 });
      await page
        .locator('label:has-text("Password")')
        .waitFor({ state: "visible", timeout: 80000 });
      passed++;
    } catch (err: any) {
      failed++;
      await handleError("Post-logout page validation failed", {
        error: err.message,
      });
      throw err;
    } finally {
      // await publishMetric(total, passed, failed, "Logout Tests");
    }
  });
}
