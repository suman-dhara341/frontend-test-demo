import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { empId, orgId, idToken, isAdmin } from "../authService/orgId_empId";
import { handleError } from "../handleError";
import { publishMetric } from "../../publishMetric/publishMetric";

export default function () {
  test("Feed page", async ({ page, request }) => {
    let total = 0;
    let passed = 0;
    let failed = 0;

    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    console.log(`Using API Base URL: ${API_BASE_URL}`);
    console.log(`Using User Base URL: ${USER_BASE_URL}`);
    console.log(idToken, orgId, empId, isAdmin);

    await page.goto(`${USER_BASE_URL}/feed`);

    try {
      total++;
      try {
        const profileRES = await request.get(
          `${API_BASE_URL}/org/${orgId}/employee/${empId}`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );
        const profileData = await profileRES.json();
        if (profileData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/feed-profile-unauthorized.png",
          });
          console.error("Profile data fetch unauthorized:", profileData);
          throw new Error("Unauthorized access to profile data.");
        }

        expect(profileData.status).toBe(200);
        expect(profileData.message).toBe("Data fetched successfully!");
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Profile data fetch failed", error);
        throw error;
      }

      // 4. Profile page navigation/validation
      total++;
      try {
        await page.click("#employee_name");
        await page.locator("#award").waitFor({ state: "visible" });
        await page.locator("#badges").waitFor({ state: "visible" });
        await page
          .locator("#journey")
          .waitFor({ state: "visible", timeout: 80000 });
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Profile page navigation failed", error);
        throw error;
      }
      await page.goBack();

      // Awards tab
      total++;
      try {
        await page.click("#awards");
        await page
          .locator("#totalAwardsReceived")
          .waitFor({ state: "visible", timeout: 80000 });
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Awards tab navigation failed", error);
        throw error;
      }
      await page.goBack();

      // Badges tab
      total++;
      try {
        await page.click("#badges");
        await page
          .locator("#totalBadgesReceived")
          .waitFor({ state: "visible", timeout: 80000 });
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Badges tab navigation failed", error);
        throw error;
      }
      await page.goBack();

      // Reports To/Manager check
      if (!isAdmin) {
        total++;
        try {
          const managerName = await page.locator("#reportsTo").textContent();
          await page.click("#reportsTo");
          const uiManagerName = await page
            .locator("#profile_name")
            .textContent();
          await expect(uiManagerName?.trim()).toBe(managerName);
          await page.goBack();
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Manager check failed", error);
          throw error;
        }
      }

      total++;
      await expect(page).toHaveURL(`${USER_BASE_URL}/feed/`);
      passed++;

      // 5. Give Recognition flow
      total++;
      try {
        await page.click("#giveRecognition");
        await page
          .locator('input[placeholder="Search Custom Badge..."]')
          .waitFor({ state: "visible" });
        await page.fill(
          'input[placeholder="Search Custom Badge..."]',
          "Best Quality"
        );
        await page.click("#badge_select");
        await page.fill(
          'input[placeholder="Search an employee"]',
          "Mark Zuckerberg"
        );
        await page
          .getByRole("option", { name: "Mark Zuckerberg" })
          .first()
          .waitFor();
        await page
          .getByRole("option", { name: "Mark Zuckerberg" })
          .first()
          .click();
        // await page.fill(
        //   'input[placeholder="Search and tag employees"]',
        //   "Mark Zuckerberg"
        // );
        // await page
        //   .getByRole("option", { name: "Mark Zuckerberg" })
        //   .first()
        //   .waitFor();
        // await page
        //   .getByRole("option", { name: "Mark Zuckerberg" })
        //   .first()
        //   .click();
        await page.fill("#recognition_details_content", "Best Quality");

        const responsePromise = page.waitForResponse(
          (response) =>
            response.url().includes(`/org/${orgId}/recognition`) &&
            response.request().method() === "POST"
        );

        await page.click("#giveRecognition_submit");
        const responseData = await responsePromise;
        const body = await responseData.json();
        if (body.status !== 201) {
          await page.screenshot({
            path: "test-results/feed-recognition-fail.png",
          });
          console.error("Recognition submit failed:", body);
          throw new Error(
            `Recognition failed: Status=${body.status}, Message=${body.message}`
          );
        }
        await expect(body.status).toBe(201);
        await expect(body.message).toBe("Recognition saved success!");
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Give Recognition failed", error);
        throw error;
      }

      // 6. Feed data
      total++;
      try {
        const feedResponse = await request.get(
          `${API_BASE_URL}/org/${orgId}/feed?employeeId=${empId}&maxResults=3`,
          {
            headers: {
              authorization: `Bearer ${idToken}`,
            },
          }
        );
        const feedData = await feedResponse.json();

        if (feedData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/feed-feeddata-unauthorized.png",
          });
          console.error("Feed data unauthorized:", feedData);
          throw new Error("Unauthorized access to feed data.");
        }
        expect(feedData.status).toBe(200);
        expect(feedData.message).toBe("Feeds fetched successfully!");

        if (Array.isArray(feedData.data) && feedData.data.length > 0) {
          if (feedData.data[0].isLike === false) {
            await expect(page.locator("#feed_like_button").first()).toBeVisible(
              { timeout: 10000 }
            );
            await page.locator("#feed_like_button").first().click();
          }

          await page.locator("#feed_like_modal").first().waitFor({
            state: "visible",
            timeout: 8000,
          });

          await page.locator("#feed_like_modal").first().click();

          await page.waitForSelector("#likeCloseButton", {
            state: "visible",
            timeout: 8000,
          });
          await page.locator("#likeCloseButton").click();

          const commentInput = page
            .locator(
              'input[name="commentContent"][placeholder="Add a comment..."]'
            )
            .first();
          await commentInput.waitFor({ state: "visible" });
          await commentInput.fill("well done.");
          await commentInput.waitFor({ state: "visible", timeout: 80000 });
          await commentInput.type("well done.");
          await page.locator("#sendCommentButton").first().click();

          await page
            .locator("#commentsButton")
            .first()
            .waitFor({ state: "visible", timeout: 8000 });

          await page.locator("#commentsButton").first().click();
          await page
            .locator('text="All Comments"')
            .waitFor({ state: "visible", timeout: 5000 });

          await page
            .locator("#commentCloseButton")
            .waitFor({ state: "visible", timeout: 5000 });

          await page.locator("#commentCloseButton").click();
        }
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Feed data fetch failed", error);
        throw error;
      }

      // 7. Activity section
      total++;
      await page.click("#viewAllActivity");
      await page.locator("#Activity").waitFor({
        state: "visible",
        timeout: 80000,
      });
      await page.goBack();
      passed++;

      // 8. Activities API check
      total++;
      try {
        const activityResponse = await request.get(
          `${EnvConfigPlaywright.apiUrl}/org/${orgId}/notification/activity?userId=${empId}&maxResults=20`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );
        const activityData = await activityResponse.json();

        if (activityData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/feed-activity-unauthorized.png",
          });
          console.error("Activity data fetch unauthorized:", activityData);
          throw new Error("Unauthorized access to activity data.");
        }
        await expect(activityData.status).toBe(200);
        await expect(activityData.message).toBe(
          "Activity successfully retrieved!"
        );
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Activity API fetch failed", error);
        throw error;
      }
    } catch (err) {
      failed++;
      if (!page.isClosed()) {
        await page.screenshot({
          path: `test-results/feed-unexpected-error-${Date.now()}.png`,
          fullPage: true,
        });
      } else {
        console.warn("Could not take screenshot: page is closed.");
      }
      console.error("Test failed with error:", err);
      throw err;
    } finally {
      try {
        await publishMetric(total, passed, failed, "Feed Page Tests");
        console.log(
          `Published metrics: Total=${total}, Passed=${passed}, Failed=${failed}`
        );
      } catch (error) {
        console.error("Error publishing metrics:", error);
      }
    }
  });
}
