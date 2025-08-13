import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";
import { empId, idToken, orgId } from "../authService/orgId_empId";
import { handleError } from "../handleError";
import { publishMetric } from "../../publishMetric/publishMetric";

const task = "Demo Task";
const taskDescription = "This is a demo task description for testing purposes.";

export default function () {
  test("Employee Goals Page", async ({ page, request }) => {
    let total = 0;
    let passed = 0;
    let failed = 0;

    await page.pause();
    const API_BASE_URL = EnvConfigPlaywright.apiUrl;
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    try {
      total++;
      await page.goto(`${USER_BASE_URL}/feed`);
      await page.locator("#menu-item").getByRole("button").click();
      await page.getByRole("link", { name: /goals/i }).click();
      await expect(page).toHaveURL(`${USER_BASE_URL}/goals`);
      passed++;

      total++;
      try {
        await page.locator("#create-goal").click();
        await page.fill('input[name="goalName"]', "Test Goal");
        await page.fill(
          'textarea[name="goalDescription"]',
          "This is a test goal."
        );
        const tagInput = page.getByRole("textbox", { name: "Add a tag" });

        await tagInput.fill("Tag");
        await tagInput.press("Enter");
        const now = new Date();
        const year = now.getFullYear();
        const decValue = `${year}-12`;
        await page.locator('input[name="dueDate"]').fill(decValue);
        await page.getByRole("button", { name: "Create Goal" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Goal creation failed", error);
        throw error;
      }

      total++;
      try {
        await page
          .locator(".lucide.lucide-ellipsis-vertical > circle")
          .first()
          .click();

        await page.getByText("Edit Goal").click();
        await page.fill('input[name="goalName"]', "Updated Test Goal");
        await page.fill(
          'textarea[name="goalDescription"]',
          "Updated description."
        );
        const tagInput = page.getByRole("textbox", { name: "Add a tag" });
        await tagInput.fill("Updated Tag");
        await tagInput.press("Enter");
        await page.getByRole("button", { name: "Submit" }).click();
        passed++;
      } catch (error: any) {
        failed++;
        await handleError("Goal update failed", error);
        throw error;
      }

      total++;
      const employeeGoalsApi = await request.get(
        `${API_BASE_URL}/org/${orgId}/okr/${empId}/goals`,
        {
          headers: {
            authorization: `Bearer ${idToken}`,
          },
        }
      );

      const employeeGoals = await employeeGoalsApi.json();

      if (employeeGoals.message === "Unauthorized") {
        const err = new Error("Unauthorized access to Employee Goals data");
        handleError("EmployeeGoals API - Unauthorized.");
        throw err;
      }

      expect(employeeGoals.message).toBe(
        "List of goals record fetched successfully"
      );
      expect(employeeGoals.status).toBe(200);
      passed++;

      if (employeeGoals?.data && employeeGoals?.data.length > 0) {
        total++;
        try {
          await page.waitForSelector("#goal_title", { state: "visible" });
          await page.locator("#goal_title").click();
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Goal details navigation failed", error);
          throw error;
        }

        total++;
        try {
          await page.locator("#create-task").click();
          await page.fill('input[name="taskName"]', task);
          await page.fill('textarea[name="taskDescription"]', taskDescription);
          await page.getByRole("button", { name: "Create Task" }).click();
          const taskNameLocator = await page.waitForSelector("#task_name", {
            state: "visible",
            timeout: 40000,
          });
          const taskName = await taskNameLocator.textContent();
          if (!taskName?.includes(task)) {
            throw new Error("Task creation verification failed.");
          }
          expect(taskName?.trim()).toBe(task);
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Task create Error", error);
          throw error;
        }

        // DEFERRED
        total++;
        try {
          await page.locator("#task_update").click();
          await page.fill('input[name="taskName"]', "Updated Task");
          await page.fill(
            'textarea[name="taskDescription"]',
            "Updated description"
          );
          await page.getByRole("combobox").click();
          await page.selectOption('select[name="status"]', "DEFERRED");
          await page.getByRole("button", { name: "Submit" }).click();

          await page.waitForTimeout(6000);
          const taskName = await page.locator("#task_status").textContent();
          expect(taskName?.trim()).toBe("DEFERRED");
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Task update Error", error);
          throw error;
        }

        // IN PROGRESS
        total++;
        try {
          await page.locator("#task_update").click();

          await page.getByRole("combobox").click();
          await page.selectOption('select[name="status"]', "IN PROGRESS");
          await page.getByRole("button", { name: "Submit" }).click();

          await page.waitForTimeout(6000);
          const taskName = await page.locator("#task_status").textContent();
          expect(taskName?.trim()).toBe("IN PROGRESS");
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Task update Error", error);
          throw error;
        }

        // COMPLETED
        total++;
        try {
          await page.locator("#task_update").click();
          await page.getByRole("combobox").click();
          await page.selectOption('select[name="status"]', "COMPLETED");
          await page.getByRole("button", { name: "Submit" }).click();
          await page.waitForTimeout(6000);
          const statuses = await page.locator("#task_status").allTextContents();
          expect(statuses.map((s) => s.trim())).toContain("COMPLETED");
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Task update Error", error);
          throw error;
        }

        total++;
        try {
          await page.getByRole("img", { name: "Comments" }).click();
          await page.locator(".ql-editor").fill("Hello from Playwright!");
          await page.getByRole("button", { name: "Post" }).click();
          await page.getByRole("button", { name: "Edit" }).click();
          await page.locator(".ql-editor").fill("");
          await page.locator(".ql-editor").fill("Hello");
          await page.getByRole("button", { name: "Update" }).nth(1).click();
          await page.getByRole("button", { name: "Delete" }).click();
          await page
            .locator("div")
            .filter({ hasText: /^Comments✕$/ })
            .getByRole("button")
            .click();

          await page.getByRole("img", { name: "Delete" }).click();
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Comments interaction Error", error);
          throw error;
        }

        await page.goBack();

        total++;
        try {
          await page
            .locator(".lucide.lucide-ellipsis-vertical > circle")
            .first()
            .click();

          await Promise.all([page.getByText("Delete Goal").click()]);
          await page.waitForTimeout(6000);
          passed++;
        } catch (error: any) {
          failed++;
          await handleError("Goal deletion Error", error);
          throw error;
        }

        total++;
        await expect(page).toHaveURL(`${USER_BASE_URL}/goals`, {
          timeout: 80000,
        });
        passed++;
      }
    } catch (err: any) {
      failed++;
      await handleError("Employee Goals Test: Unexpected Error", err);
      throw err;
    } finally {
      try {
        await publishMetric(total, passed, failed, "Employee Goals Page Tests");
        console.log(
          `Published metrics: Total=${total}, Passed=${passed}, Failed=${failed}`
        );
      } catch (error) {
        console.error("Error publishing metrics:", error);
      }
    }
  });
}
