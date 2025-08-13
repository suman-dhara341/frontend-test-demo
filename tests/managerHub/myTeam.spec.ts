import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { idToken } from "../authService/orgId_empId";

export default function () {
  test("ManagerHubs Page myteam tab", async ({ page, request }) => {
    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    let total = 0;
    let passed = 0;
    let failed = 0;
await page.pause();
    try {
      total++;
      await page.goto(`${USER_BASE_URL}/feed`);

      total++;
      await expect(page).toHaveURL(`${USER_BASE_URL}/feed`, { timeout: 80000 });
      passed++;

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

      total++;
      await page.locator("#managerHub").click();
      passed++;

      let hierarchyData;
      try {
        total++;
        await page.waitForTimeout(2000);
        await page.getByRole("link", { name: "My Team" }).click();
        const hierarchyAPI = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/employee/${USER_DATA.empId}/hierarchy?type=spotlight`,
          { headers: { authorization: `Bearer ${idToken}` } }
        );
        hierarchyData = await hierarchyAPI.json();
        if (hierarchyData?.message === "Unauthorized") {
          failed++;
          console.error("[Hierarchy API] Unauthorized access", hierarchyData);
          throw new Error("Unauthorized access to the Hierarchy API.");
        }
        expect(hierarchyData.message).toBe(
          "Hierarchy Data fetched successfully!"
        );
        expect(hierarchyData.status).toBe(200);
        passed++;
      } catch (error) {
        failed++;
        console.error("Error navigating to My Team:", error);
        throw new Error("Error navigating to My Team");
      }

      try {
        total++;
        const awardAPI = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${hierarchyData.data[1].employeeId}/report-self/awards-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver`,
          { headers: { authorization: `Bearer ${idToken}` } }
        );
        const awardData = await awardAPI.json();

        if (awardData?.message === "Unauthorized") {
          failed++;
          console.error("[Award API] Unauthorized access", awardData);
          throw new Error("Unauthorized access to the Award API.");
        }
        expect(awardData.message).toBe("Request successful!");
        expect(awardData.status).toBe(200);
        passed++;
      } catch (error) {
        failed++;
        console.error("Error fetching award data:", error);
        throw new Error("Error fetching award data");
      }

      try {
        total++;
        const recognitionAPI = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${hierarchyData.data[1].employeeId}/report-self/recognitions-received-or-given-x-period-month-on-month?period=last6Months&userType=receiver`,
          { headers: { authorization: `Bearer ${idToken}` } }
        );
        const recognitionData = await recognitionAPI.json();

        if (recognitionData?.message === "Unauthorized") {
          failed++;
          console.error(
            "[Recognition API] Unauthorized access",
            recognitionData
          );
          throw new Error("Unauthorized access to the Recognition API.");
        }
        expect(recognitionData.message).toBe("Request successful!");
        expect(recognitionData.status).toBe(200);

        const pageCountText = await page
          .locator("#totalRecognitionCount")
          .innerText();

        passed++;
      } catch (error) {
        failed++;
        console.error("Error fetching recognition data:", error);
        throw new Error("Error fetching recognition data");
      }

      try {
        total++;
        const badgeAPI = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/analytics/user/${hierarchyData.data[1].employeeId}/report-self/badges-received-x-period-month-on-month?period=last6Months&userType=receiver`,
          { headers: { authorization: `Bearer ${idToken}` } }
        );
        const badgeData = await badgeAPI.json();
        if (badgeData?.message === "Unauthorized") {
          failed++;
          console.error("[Badge API] Unauthorized access", badgeData);
          throw new Error("Unauthorized access to the Badge API.");
        }
        expect(badgeData.message).toBe("Request successful!");
        expect(badgeData.status).toBe(200);

        const pageCountText = await page
          .locator("#totalBadgeCount")
          .innerText();

        passed++;
      } catch (error) {
        failed++;
        console.error("Error fetching badge data:", error);
        throw new Error("Error fetching badge data");
      }

      // goals;
      try {
        total++;
        await page.click("#goals");

        // /alpha/org/a19cb358-d788-4166-8732-565852821cde/okr/ed68a455-44f4-4243-9b30-46bb79f9c2f9/goals
        const goalsAPI = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/okr/${hierarchyData.data[1].employeeId}/goals`,
          { headers: { authorization: `Bearer ${idToken}` } }
        );
        const goalsData = await goalsAPI.json();
        if (goalsData?.message === "Unauthorized") {
          failed++;
          console.error("[Goals API] Unauthorized access", goalsData);
          throw new Error("Unauthorized access to the Goals API.");
        }
        expect(goalsData.message).toBe(
          "List of goals record fetched successfully"
        );
        expect(goalsData.status).toBe(200);
        passed++;
      } catch (error) {
        failed++;
        console.error("Error clicking on goals tab:", error);
        throw new Error("Error clicking on goals tab");
      }

      try {
        total++;
        await page.click("#growth");
        const growthAPI = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/growth/${hierarchyData.data[1].employeeId}/conversations`,
          { headers: { authorization: `Bearer ${idToken}` } }
        );
        const growthData = await growthAPI.json();
        if (growthData?.message === "Unauthorized") {
          failed++;
          console.error("[Growth API] Unauthorized access", growthData);
          throw new Error("Unauthorized access to the Growth API.");
        }
        expect(growthData.message).toBe("Data fetched success!");
        expect(growthData.status).toBe(200);

        // /alpha/org/a19cb358-d788-4166-8732-565852821cde/employee/ed68a455-44f4-4243-9b30-46bb79f9c2f9
        const employeeAPI = await request.get(
          `${API_BASE_URL}/org/${USER_DATA.orgId}/employee/${hierarchyData.data[1].employeeId}`,
          { headers: { authorization: `Bearer ${idToken}` } }
        );
        const employeeData = await employeeAPI.json();
        if (employeeData?.message === "Unauthorized") {
          failed++;
          console.error("[Employee API] Unauthorized access", employeeData);
          throw new Error("Unauthorized access to the Employee API.");
        }
        expect(employeeData.message).toBe("Data fetched successfully!");
        expect(employeeData.status).toBe(200);

        passed++;
      } catch (error) {
        failed++;
        console.error("Error clicking on growth tab:", error);
        throw new Error("Error clicking on growth tab");
      }

      total++;
      await expect(page.locator("body")).toContainText("Manager Hub");
      passed++;
    } catch (err: any) {
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
