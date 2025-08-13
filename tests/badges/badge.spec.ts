import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken, orgId } from "../authService/orgId_empId";
import { handleError } from "../handleError";
import { publishMetric } from "../../publishMetric/publishMetric";

export default function () {
  test("Badge Page", async ({ page, request }) => {
    let total = 0;
    let passed = 0;
    let failed = 0;

    await page.addInitScript(() => {
      localStorage.setItem("feedTour", "true");
      localStorage.setItem("badgesTour", "true");
      localStorage.setItem("badgesDetailsTour", "true");
      localStorage.setItem("anonymousFeedbackPlaywright", "true");
    });

    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;
    total++;
    await page.goto(`${USER_BASE_URL}/feed`);
    await expect(page).toHaveURL(`${USER_BASE_URL}/feed`);
    passed++;

    try {
      total++;
      try {
        await page.locator("#menu-item").getByRole("button").click();
        await page.getByRole("link", { name: /badges/i }).click();
        await expect(page).toHaveURL(`${USER_BASE_URL}/badges`);
        passed++;
      } catch (err: any) {
        failed++;
        await handleError("Navigation to Badges page failed", err);
        await page.screenshot({ path: "badges-nav-error.png", fullPage: true });
        throw err;
      }

      total++;
      let allBadge;
      try {
        const badgeApi = await request.get(
          `${API_BASE_URL}/badge?maxResults=24&&orgId=${orgId}`,
          {
            headers: {
              authorization: `Bearer ${idToken}`,
            },
          }
        );
        allBadge = await badgeApi.json();

        if (allBadge.message === "Unauthorized") {
          const err = new Error("Unauthorized access to badges data");
          await handleError("Badge API - Unauthorized", err);
          throw err;
        }

        expect(allBadge.message).toBe("Data fetched successfully!");
        expect(allBadge.status).toBe(200);
        passed++;
      } catch (err: any) {
        failed++;
        await handleError("Badge API Fetch Failed", err);
        await page.screenshot({ path: "badge-list-error.png", fullPage: true });
        throw err;
      }

      // If badge exists, validate its details
      if (allBadge?.data && allBadge?.data.length > 0) {
        total++;
        try {
          await expect(page.locator("#badge_select")).toBeVisible({
            timeout: 80000,
          });
          await page.locator("#badge_select").click();

          const detailsAPIResp = await request.get(
            `${API_BASE_URL}/badge/Custom/${allBadge?.data[0]?.category}?orgId=${orgId}`,
            {
              headers: {
                authorization: `Bearer ${idToken}`,
              },
            }
          );

          const badgeDetails = await detailsAPIResp.json();

          let uiBadgeName: string | null = null;
          try {
            await page
              .locator("#badge_name")
              .waitFor({ state: "visible", timeout: 80000 });
            uiBadgeName = await page.locator("#badge_name").textContent();
          } catch (e) {
            const err = new Error("Badge name element (#badge_name) not found");
            await handleError("UI Error: Badge Name Missing", err);
            throw err;
          }

          if (badgeDetails.data.name === "undefined") {
            const err = new Error("API did not return 'name'");
            await handleError("Badge API Missing 'name'", err);
            throw err;
          }

          if (badgeDetails.data.name?.trim() !== uiBadgeName?.trim()) {
            const err = new Error("Mismatch between UI and API badge name");
            await handleError("Badge Name Mismatch", err);
            throw err;
          }

          expect(badgeDetails.data.name?.trim()).toBe(uiBadgeName?.trim());

          await page.goBack();
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Badge Detail Check Failed", error);
          await page.goBack();
          throw error;
        }
      }
    } catch (err: any) {
      failed++;
      await handleError("Badge Test: Unexpected Error", err);
      throw err;
    } finally {
      try {
        await publishMetric(total, passed, failed, "Badge Page Tests");
        console.log(
          `Published metrics: Total=${total}, Passed=${passed}, Failed=${failed}`
        );
      } catch (error) {
        console.error("Error publishing metrics:", error);
      }
    }
  });
}
