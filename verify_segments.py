from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_segments_accessibility(page: Page):
    # 1. Go to the POC page
    page.goto("http://localhost:3000/research-poc")

    # 2. Wait for segments to appear
    # Locate the first segment button.
    # Since we changed it to a button, this locator MUST find it.
    segment_btn = page.get_by_role("button").filter(has_text="This is segment number 0").first

    expect(segment_btn).to_be_visible()

    # 3. Focus the segment via keyboard to check focus styles
    segment_btn.focus()

    # 4. Take a screenshot
    # Ensure directory exists
    os.makedirs("/home/jules/verification", exist_ok=True)
    page.screenshot(path="/home/jules/verification/segment_focus.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_segments_accessibility(page)
            print("Verification script finished successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            exit(1)
        finally:
            browser.close()
