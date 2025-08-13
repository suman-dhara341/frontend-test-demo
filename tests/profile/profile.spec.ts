import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { empId, idToken, orgId } from "../authService/orgId_empId";
import { handleError } from "../handleError";
import { publishMetric } from "../../publishMetric/publishMetric";

export default function () {
  test("Profile page", async ({ page, request }) => {
    let total = 0;
    let passed = 0;
    let failed = 0;

    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    total++;
    await page.goto(`${USER_BASE_URL}/feed`);
    await page.waitForURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });
    await expect(page).toHaveURL(`${USER_BASE_URL}/feed`);
    await page.locator("#navbar_avatar").click();
    await page.getByRole("link", { name: "Profile" }).click();
    passed++;

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
            path: "test-results/profile-unauthorized.png",
          });
          console.error("Profile data fetch unauthorized:", profileData);
          throw new Error("Unauthorized access to profile data.");
        }

        expect(profileData.status).toBe(200);
        expect(profileData.message).toBe("Data fetched successfully!");

        const expectedName = [
          profileData?.data?.firstName,
          profileData?.data?.middleName,
          profileData?.data?.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        await expect(page.locator("#profile_name")).toHaveText(expectedName);
        await expect(page.locator("#designationName")).toHaveText(
          profileData?.data?.designation?.designationName
        );
        await expect(page.locator("#shortDescription")).toHaveText(
          profileData?.data?.shortDescription
        );
        await expect(page.locator("#primaryPhone")).toHaveText(
          profileData?.data?.primaryPhone
        );
        await expect(page.locator("#primaryEmail")).toHaveText(
          profileData?.data?.primaryEmail
        );
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Unexpected error in profile test:", error);
        throw error;
      }

      // navbar check
      total++;
      try {
        await page.getByRole("button", { name: "Awards" }).click();
        await page.getByRole("button", { name: "Badges" }).click();
        await page.getByRole("button", { name: "Recognition" }).click();
        await page.getByRole("button", { name: "Journey" }).click();
        await page.getByRole("button", { name: "Insights" }).click();
        await page.getByRole("button", { name: "Activity" }).click();

        await page.getByRole("button", { name: "Spotlight" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Navbar check failed:", error);
        throw error;
      }

      // award
      total++;
      try {
        const awardRES = await request.get(
          `${API_BASE_URL}/org/${orgId}/award/received-by/${empId}?withAwardDetail=true&status=assigned&maxResults=24?`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );
        const awardData = await awardRES.json();
        if (awardData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/award-unauthorized.png",
          });
          console.error("Award data fetch unauthorized:", awardData);
          throw new Error("Unauthorized access to award data.");
        }

        expect(awardData.status).toBe(200);
        expect(awardData.message).toBe("Data fetched successfully!");

        await page.waitForSelector("#view_all_awards", { state: "visible" });
        await page.locator("#view_all_awards").click();

        await page.getByRole("button", { name: "Spotlight" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Award data fetch failed:", error);
        throw error;
      }

      total++;
      try {
        const badgeRES = await request.get(
          `${API_BASE_URL}/badge/user-badges?orgId=${orgId}&userId=${empId}&maxResults=20&`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );

        const badgeData = await badgeRES.json();
        if (badgeData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/badge-unauthorized.png",
          });
          console.error(
            "[UNAUTHORIZED] Badge data fetch unauthorized:",
            badgeData
          );
          throw new Error("Unauthorized access to badge data.");
        }

        expect(badgeData.status).toBe(200);
        expect(badgeData.message).toBe("Data fetched successfully!");

        await page.waitForSelector("#view_all_badges", { state: "visible" });
        await page.locator("#view_all_badges").click();

        await page.getByRole("button", { name: "Spotlight" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Badge data fetch failed:", error);
        throw error;
      }

      // view_all_recognition
      total++;
      try {
        const recognitionType = "received-by";

        const recognitionRes = await request.get(
          `${API_BASE_URL}/org/${orgId}/recognition/${recognitionType}/${empId}?type=Recognition&maxResults=10&$`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );

        const recognitionData = await recognitionRes.json();
        if (recognitionData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/recognition-unauthorized.png",
          });
          console.error(
            "recognition data fetch unauthorized:",
            recognitionData
          );
          throw new Error("Unauthorized access to recognition data.");
        }

        expect(recognitionData.status).toBe(200);
        expect(recognitionData.message).toBe("Recognitions fetched success!");

        await page.waitForSelector("#view_all_recognition", {
          state: "visible",
        });
        await page.locator("#view_all_recognition").click();

        await page.getByRole("button", { name: "Spotlight" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Recognition data fetch failed:", error);
        throw error;
      }

      // view_all_journey;
      total++;
      try {
        const journeyRES = await request.get(
          `${API_BASE_URL}/org/${orgId}/employee/${empId}/journey`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );

        const journeyData = await journeyRES.json();
        if (journeyData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/journey-unauthorized.png",
          });
          console.error("Journey data fetch unauthorized:", journeyData);
          throw new Error("Unauthorized access to journey data.");
        }

        expect(journeyData.status).toBe(200);
        expect(journeyData.message).toBe("Data fetched successfully!");

        await page.waitForSelector("#view_all_journey", { state: "visible" });
        await page.locator("#view_all_journey").click();

        await page.getByRole("button", { name: "Spotlight" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Journey data fetch failed:", error);
        throw error;
      }

      // Hierarchy
      total++;
      try {
        const hierarchyRES = await request.get(
          `${API_BASE_URL}/org/${orgId}/employee/${empId}/hierarchy?type=spotlight`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );

        const hierarchyData = await hierarchyRES.json();
        if (hierarchyData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/journey-unauthorized.png",
          });
          console.error("Journey data fetch unauthorized:", hierarchyData);
          throw new Error("Unauthorized access to journey data.");
        }

        expect(hierarchyData.status).toBe(200);
        expect(hierarchyData.message).toBe(
          "Hierarchy Data fetched successfully!"
        );

        await page.waitForSelector("#view_all_hierarchy", { state: "visible" });
        await page.locator("#view_all_hierarchy").click();
        await page.goBack();

        await page.getByRole("button", { name: "Spotlight" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Hierarchy data fetch failed:", error);
        throw error;
      }

      // view_all_insights
      total++;
      try {
        const InsightsRES = await request.get(
          `${API_BASE_URL}/org/${orgId}/analytics/user/${empId}/report-self/aggregated-recognitions-badges-awards-received-x-period-month-on-month?period=last6Months&userId=${empId}`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );
        const InsightsData = await InsightsRES.json();
        if (InsightsData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/journey-unauthorized.png",
          });
          console.error("Journey data fetch unauthorized:", InsightsData);
          throw new Error("Unauthorized access to journey data.");
        }

        expect(InsightsData.status).toBe(200);
        expect(InsightsData.message).toBe("Request successful!");
        // await page.waitForSelector("#timePeriodDropdown", { state: "visible" });
        // await page.locator("#timePeriodDropdown").click();

        // await page
        //   .getByRole("listitem")
        //   .filter({ hasText: "Last 3 Months" })
        //   .click();

        // await page.locator("#timePeriodDropdown").click();

        // await page.getByText("Last Year").click();

        // await page.waitForSelector("#view_all_insights", { state: "visible" });
        // await page.locator("#view_all_insights").click();

        // await page.waitForSelector("#timePeriodDropdown", { state: "visible" });
        // await page.locator("#timePeriodDropdown").click();

        // await page
        //   .getByRole("listitem")
        //   .filter({ hasText: "Last 3 Months" })
        //   .click();

        // await page.locator("#timePeriodDropdown").click();

        // await page.getByText("Last Year").click();

        // await page.waitForSelector("#userSortButton", { state: "visible" });
        // await page.locator("#userSortButton").click();

        // await expect(page.getByText("Total Awards")).toBeVisible();
        // await expect(page.getByText("Total Recognitions")).toBeVisible();
        // await expect(page.getByText("Total Badges")).toBeVisible();
        // await expect(page.getByText("Total Feed")).toBeVisible();
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Insights data fetch failed:", error);
        throw error;
      }

      //pulse
      total++;
      try {
        const today = new Date();
        const firstDayOfLastMonth = startOfMonth(addMonths(today, -1));
        const lastDayOfCurrentMonth = endOfMonth(today);
        const DATE_ONE = format(firstDayOfLastMonth, "yyyy-MM-dd");
        const DATE_TWO = format(lastDayOfCurrentMonth, "yyyy-MM-dd");

        const pulseRES = await request.get(
          `${API_BASE_URL}/org/${orgId}/pulse/user/${empId}?fromDate=${DATE_ONE}&toDate=${DATE_TWO}`,
          {
            headers: { authorization: `Bearer ${idToken}` },
          }
        );
        const pulseData = await pulseRES.json();
        if (pulseData.message === "Unauthorized") {
          await page.screenshot({
            path: "test-results/journey-unauthorized.png",
          });
          console.error("Journey data fetch unauthorized:", pulseData);
          throw new Error("Unauthorized access to journey data.");
        }

        expect(pulseData.status).toBe(200);
        expect(pulseData.message).toBe("Data fetched success!");

        await page.getByRole("button", { name: "Spotlight" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        handleError("Pulse data fetch failed:", error);
        throw error;
      }
    } catch (err: any) {
      failed++;
      handleError("Unexpected error in profile test:", err);
      throw err;
    } finally {
      try {
        await publishMetric(total, passed, failed, "Profile Page Tests");
        console.log(
          `Published metrics: Total=${total}, Passed=${passed}, Failed=${failed}`
        );
      } catch (error) {
        console.error("Error publishing metrics:", error);
      }
    }
  });
}
