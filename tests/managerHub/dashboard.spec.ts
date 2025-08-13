import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken } from "../authService/orgId_empId";

export default function () {
  test("ManagerHub Page", async ({ page, request }) => {
    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    let total = 0;
    let passed = 0;
    let failed = 0;

    await page.goto(`${USER_BASE_URL}/feed`);

    try {
      // --- Step 1: Verify page load ---
      await page.pause();
      total++;
      await expect(page).toHaveURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });
      passed++;

      // --- Step 2: Get USER_DATA from localStorage ---
      total++;
      const USER_DATA = await page.evaluate(() => {
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

      if (!USER_DATA.orgId || !USER_DATA.empId) {
        failed++;
        console.error("User data not found in localStorage.");
        throw new Error("User data not found in localStorage.");
      }
      passed++;

      // --- Step 3: Navigate to ManagerHub ---
      total++;
      await page.locator("#managerHub").click();
      passed++;

      // --- Step 4: Go to Dashboard section ---
      total++;
      try {
        await page.getByRole("link", { name: "Dashboard" }).click();
        await expect(page).toHaveURL(
          `${USER_BASE_URL}/managerHub?tab=Dashboard`
        );
        passed++;
      } catch (err) {
        failed++;
        throw new Error(`Failed to navigate to Dashboard tab. ${err.message}`);
      }

      // --- Step 5: Award Report API check ---
      total++;
      const awardReportAPI = await request.get(
        `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-awards-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10`,
        {
          headers: { authorization: `Bearer ${idToken}` },
        }
      );
      const awardReportData = await awardReportAPI.json();

      if (awardReportData?.message === "Unauthorized") {
        failed++;
        throw new Error("Unauthorized access to the Award API.");
      }

      if (awardReportData?.data && awardReportData.data.length > 0) {
        const totalAwardCount = awardReportData.data.reduce(
          (total, item) => total + Number(item.total_awards || 0),
          0
        );

        try {
          await page.waitForSelector("#totalAwardCount", { timeout: 10000 });
          await expect(page.locator("#totalAwardCount")).toHaveText(
            totalAwardCount.toString()
          );
          passed++;
        } catch (err) {
          failed++;
          throw new Error(
            `Award count mismatch or element not found.\nExpected: ${totalAwardCount}\nError: ${err.message}`
          );
        }
      }

      // --- Step 6: Recognition Report API check ---
      total++;
      const recognitionReportAPI = await request.get(
        `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-recognitions-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver&empIds=&topN=10`,
        {
          headers: { authorization: `Bearer ${idToken}` },
        }
      );
      const recognitionReportData = await recognitionReportAPI.json();

      if (recognitionReportData?.message === "Unauthorized") {
        failed++;
        throw new Error("Unauthorized access to the Recognition API.");
      }

      expect(recognitionReportData.message).toBe("Request successful!");
      expect(recognitionReportData.status).toBe(200);

      if (
        recognitionReportData?.data &&
        recognitionReportData.data.length > 0
      ) {
        const totalRecognitionCount = recognitionReportData.data.reduce(
          (total, item) => total + Number(item.total_recognitions || 0),
          0
        );

        try {
          await page.waitForSelector("#totalRecognitionCount", {
            timeout: 10000,
          });
          await expect(page.locator("#totalRecognitionCount")).toHaveText(
            totalRecognitionCount.toString()
          );
          passed++;
        } catch (err) {
          failed++;
          throw new Error(
            `Recognition count mismatch or element not found.\nExpected: ${totalRecognitionCount}\nError: ${err.message}`
          );
        }
      }

      // --- Step 7: Badge Report API check ---
      total++;
      const badgeReportAPI = await request.get(
        `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${USER_DATA.empId}/report-team/team-badges-received-x-period-month-on-month?period=last6Months&userType=receiver&empIds=`,
        {
          headers: { authorization: `Bearer ${idToken}` },
        }
      );
      const badgeReportData = await badgeReportAPI.json();

      if (badgeReportData?.message === "Unauthorized") {
        failed++;
        throw new Error("Unauthorized access to the Badge API.");
      }

      expect(badgeReportData.message).toBe("Request successful!");
      expect(badgeReportData.status).toBe(200);

      if (badgeReportData?.data && badgeReportData.data.length > 0) {
        const totalBadgeCount = badgeReportData.data.reduce(
          (total, item) => total + Number(item.total_badges || 0),
          0
        );

        try {
          await page.waitForSelector("#totalBadgeCount", { timeout: 10000 });
          await expect(page.locator("#totalBadgeCount")).toHaveText(
            totalBadgeCount.toString()
          );
          passed++;
        } catch (err) {
          failed++;
          throw new Error(
            `Badge count mismatch or element not found.\nExpected: ${totalBadgeCount}\nError: ${err.message}`
          );
        }
      }

      // --- Step 8: Dashboard filter interaction ---
      total++;
      try {
        await page.getByRole("button", { name: "Last 6 Months" }).click();
        await expect(page.getByText("Last 3 Months")).toBeVisible();
        await page.getByText("Last 3 Months").click();

        await page.waitForTimeout(500);
        await page.getByText("Last 3 Months").click();

        await expect(page.getByText("Last Year")).toBeVisible();
        await page.getByText("Last Year").click();

        await expect(
          page.getByRole("button", { name: "Received" })
        ).toBeVisible();
        await page.getByRole("button", { name: "Received" }).click();

        await expect(page.getByText("Given")).toBeVisible();
        await page.getByText("Given").click();
        await page.waitForTimeout(1000);

        await expect(page.getByText("Last Year")).toBeVisible();
        await page.getByText("Last Year").click();
        await page.waitForTimeout(1000);

        await expect(page.getByText("Last 3 Months")).toBeVisible();
        await page.getByText("Last 3 Months").click();
        await page.waitForTimeout(1000);

        await page.getByText("Last 3 Months").click();
        await page.waitForTimeout(1000);

        await expect(page.getByText("Last 6 Months")).toBeVisible();
        await page.getByText("Last 6 Months").click();
        passed++;
      } catch (err) {
        failed++;
        throw new Error(
          `Dashboard filter interaction failed.\nError: ${err.message}`
        );
      }

      // --- Step 9: Analytics tab ---
      // total++;
      // await page.getByRole("button", { name: "Analytics" }).click();
      // await page.waitForTimeout(8000);
      // await expect(page.getByText("Report")).toBeVisible();
      // await expect(page.getByText("Top Selection")).toBeVisible();
      // await expect(page.getByText("Type")).toBeVisible();
      // await expect(page.getByText("Period")).toBeVisible();
      // await expect(page.getByText("Search Employee")).toBeVisible();
      // await page.goBack();
      // passed++;

      // // --- Step 10: Analytic link ---
      // total++;
      // await page.locator("#managerHub").click();
      // await page.getByRole("link", { name: "Analytic" }).click();
      // await expect(page.getByText("Report")).toBeVisible();
      // await expect(page.getByText("Top Selection")).toBeVisible();
      // await expect(page.getByText("Type")).toBeVisible();
      // await expect(page.getByText("Period")).toBeVisible();
      // await expect(page.getByText("Search Employee")).toBeVisible();
      // passed++;
    } catch (err) {
      failed++;
      console.error("Test failed:", err);
      throw new Error(`Test failed: ${err.message}`);
    } finally {
      console.log(`\n===== TEST SUMMARY =====`);
      console.log(`Total Test Cases: ${total}`);
      console.log(`Passed: ${passed}`);
      console.log(`Failed: ${failed}`);
      console.log(`========================\n`);
    }
  });
}
