import { test, expect } from "@playwright/test";
import "dotenv/config";
import { EnvConfigPlaywright } from "../envConfig";

export default function () {
  test("Growth Page", async ({ page, request }) => {
    const USER_BASE_URL = EnvConfigPlaywright.userUrl;

    try {
      await page.goto(`${USER_BASE_URL}/feed`);

      await page.locator("#menu-item").getByRole("button").click();
      await page.getByRole("link", { name: /growth/i }).click();
      await expect(page).toHaveURL(`${USER_BASE_URL}/growth`);

      await page
        .locator("#growth")
        .getByRole("button", { name: "Create Conversation" })
        .click();

      await page.selectOption(
        'select[name="growthAreas"]',
        "Technical or Functional expertise"
      );

      await page.waitForSelector('input[name="conversationTitle"]');
      await page
        .locator('input[name="conversationTitle"]')
        .fill("My Growth Conversation Title");

      await page
        .locator(".ql-editor")
        .fill("This is a description for my growth conversation.");

      await page.getByRole("button", { name: "Submit" }).click();
      await page
        .locator("div")
        .filter({ hasText: /^My Growth Conversation Title$/ })
        .getByRole("img")
        .click();

      await page.getByText("Edit Conversation").click();

      // await page.selectOption(
      //   'select[name="growthAreas"]',
      //   "Strategic, Cognitive, or Tactical skills"
      // );

      await page.waitForSelector('input[name="conversationTitle"]');
      await page
        .locator('input[name="conversationTitle"]')
        .fill("My Growth Conversation Title Updated");

      await page
        .locator(".ql-editor")
        .fill("This is a description for my growth conversation Update.");
      await page.getByRole("button", { name: "Submit" }).click();

      await page.getByText("Discussion").click();
      await page.getByText("Create Discussion").click();

      await page
        .getByRole("textbox")
        .fill("This is a discussion for my growth conversation.");

      await page.getByRole("button", { name: "Submit" }).click();

      await page.locator("#first_update").click();

      await page
        .getByRole("textbox")
        .fill("This is a discussion for my growth conversation Updated.");
      await page.getByRole("button", { name: "Submit" }).click();

      await page.locator("#first_comments").click();

      await page
        .locator(".ql-editor")
        .fill("This is a comment for my growth conversation discussion.");

      await page.getByRole("button", { name: "Post" }).click();
      await page
        .getByText("This is a comment for my growth conversation discussion.")
        .waitFor({ state: "visible" });

      await page.getByRole("button", { name: "Edit" }).click();

      await page
        .locator(".ql-editor")
        .fill(
          "This is a comment for my growth conversation discussion update."
        );

      await page.getByRole("button", { name: "Update" }).nth(1).click();
      await page
        .getByText(
          "This is a comment for my growth conversation discussion update."
        )
        .waitFor({ state: "visible" });
      await page
        .getByText(
          "This is a comment for my growth conversation discussion update."
        )
        .waitFor({ state: "visible" });

      await page.getByRole("button", { name: "Delete" }).click();
    } catch (err: any) {
      await page.screenshot({
        path: "badge-test-unexpected-error.png",
        fullPage: true,
      });
      console.error("Test failed with error:", err.message || err);
      throw err;
    }
  });
}
