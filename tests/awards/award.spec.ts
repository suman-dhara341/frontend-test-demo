import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken } from "../authService/orgId_empId";
import { handleError } from "../handleError";
import { publishMetric } from "../../publishMetric/publishMetric";

export default function () {
  test("Award Page", async ({ page, request }) => {
    let total = 0;
    let passed = 0;
    let failed = 0;

    await page.addInitScript(() => {
      localStorage.setItem("feedTour", "true");
      localStorage.setItem("awardTour", "true");
      localStorage.setItem("awardDetailsTour", "true");
      localStorage.setItem("anonymousFeedbackPlaywright", "true");
    });

    const awardName = "Award for Excellence";
    const description = "Awarded for outstanding performance.";
    const criteria = "Met all quarterly goals and helped peers.";

    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    try {
      total++;
      await page.goto(`${USER_BASE_URL}/feed`);
      passed++;

      total++;
      try {
        await page.locator("#menu-item").getByRole("button").click();
        await page.getByRole("link", { name: /awards/i }).click();
        await expect(page).toHaveURL(`${USER_BASE_URL}/awards`);
        passed++;
      } catch (err: any) {
        failed++;
        handleError("Failed to navigate to Awards page:", err);
        throw err;
      }

      total++;
      let USER_DATA;
      try {
        USER_DATA = await page.evaluate(() => {
          try {
            const persistedAuth = localStorage.getItem("persist:auth");
            if (!persistedAuth) return { orgId: "", empId: "" };
            const parsedAuth = JSON.parse(persistedAuth);
            const userData = JSON.parse(parsedAuth.userData);
            return {
              orgId: userData["custom:orgId"] ?? "",
              empId: userData["custom:empId"] ?? "",
            };
          } catch {
            return { orgId: "", empId: "" };
          }
        });
        passed++;
      } catch (err: any) {
        failed++;
        handleError("Failed to extract user/org data from localStorage:", err);
        throw err;
      }

      total++;
      let allAward;
      try {
        const awardAPIResp = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/award?maxResults=24`,
          {
            headers: {
              authorization: `Bearer ${idToken}`,
            },
          }
        );
        allAward = await awardAPIResp.json();

        if (allAward.message === "Unauthorized") {
          const err = new Error("Unauthorized access to awards data.");
          handleError("Fetch Award List API", err);
          throw err;
        }
        expect(allAward.message).toBe("Data fetched successfully!");
        expect(allAward.status).toBe(200);
        passed++;
      } catch (err: any) {
        failed++;
        handleError("Failed to fetch awards list from API:", err);
        throw err;
      }

      // View award details
      total++;
      try {
        if (allAward.data && allAward.data.length > 0) {
          await page.waitForSelector("#award_select", {
            state: "visible",
            timeout: 10000,
          });
          await page.locator("#award_select").click();

          const detailsAPIResp = await request.get(
            `${API_BASE_URL}/org/${USER_DATA.orgId}/award/${allAward.data[0].awardId}?employeeId=${USER_DATA.empId}`,
            {
              headers: {
                authorization: `Bearer ${idToken}`,
              },
            }
          );
          const awardDetails = await detailsAPIResp.json();

          await page
            .locator("#award_details_name")
            .waitFor({ state: "visible", timeout: 80000 });
          const uiManagerName = await page
            .locator("#award_details_name")
            .textContent();

          if (awardDetails.data.awardName !== uiManagerName) {
            handleError("Mismatch in Award Details", {
              apiAwardName: awardDetails.data.awardName,
              uiAwardName: uiManagerName,
            });
          }
          expect(awardDetails.data.awardName).toBe(uiManagerName);
          expect(awardDetails.status).toBe(200);
          await page.goBack();
        }
        passed++;
      } catch (err: any) {
        failed++;
        handleError("View Award Details", err);
        throw err;
      }

      // Create award
      total++;
      try {
        await page.locator("#create-award-button").click();
        await page.fill('input[name="awardName"]', awardName);
        await page.fill('textarea[name="description"]', description);
        await page.locator(".ql-editor").fill(criteria);
        await page.locator("#file").click();
        await page.setInputFiles(
          'input[type="file"]',
          "tests/awards/fav_icon.png"
        );

        const slider = page
          .getByRole("dialog", { name: /Upload Award Image/i })
          .getByRole("slider");

        const min = Number(await slider.getAttribute("min"));
        const max = Number(await slider.getAttribute("max"));
        const desiredValue = ((min + max) / 3).toFixed(1);

        await slider.evaluate((e: any, value) => {
          e.value = value;
          e.dispatchEvent(new Event("input", { bubbles: true }));
          e.dispatchEvent(new Event("change", { bubbles: true }));
        }, desiredValue);

        await page.waitForSelector("#crop_and_save", { state: "visible" });
        await page.locator("#crop_and_save").click();

        const awardNameVal = await page
          .locator('input[name="awardName"]')
          .inputValue();
        const descriptionVal = await page
          .locator('textarea[name="description"]')
          .inputValue();
        const criteriaVal = await page.locator(".ql-editor").textContent();

        if (!awardNameVal?.trim()) {
          const err = new Error("Award Name is required.");
          handleError("Create Award - Validation", err);
          throw err;
        }

        if (!descriptionVal?.trim()) {
          const err = new Error("Description is required.");
          handleError("Create Award - Validation", err);
          throw err;
        }

        if (!criteriaVal?.trim()) {
          const err = new Error("Criteria is required.");
          handleError("Create Award - Validation", err);
          throw err;
        }

        const publishButton = page.locator("#publish_award_button");

        await expect(publishButton).toBeEnabled({ timeout: 80000 });
        await expect(publishButton).toBeVisible();

        const [responseData] = await Promise.all([
          page.waitForResponse(
            (response) =>
              response.url().includes(`/org/${USER_DATA.orgId}/award`) &&
              response.request().method() === "POST"
          ),
          publishButton.click(),
        ]);

        await expect(page).toHaveURL(`${USER_BASE_URL}/awards`);

        const body = await responseData.json();
        if (body.status !== 201) {
          const err = new Error(`Award creation failed: ${body.message}`);
          handleError("Create Award API", err);
          throw err;
        }
        expect(body.status).toBe(201);
        expect(body.message).toBe("Data created successfully!");
        passed++;
      } catch (err: any) {
        failed++;
        handleError("Create Award", err);
        throw err;
      }
    } catch (err: any) {
      failed++;
      handleError("Unexpected Failure in Award Page Test", err);
      throw err;
    } finally {
      try {
        await publishMetric(total, passed, failed, "Award Page Tests");
      } catch (error) {
        console.error("Error publishing metrics:", error);
      }
    }
  });
}
