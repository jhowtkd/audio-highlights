from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        print("Navigating to page...")
        page.goto("http://localhost:3000/poc-virtuoso")

        # Wait for the heading
        print("Waiting for heading...")
        page.wait_for_selector("h2:has-text('Virtualized Transcript POC')")

        # Wait for segments to render
        print("Waiting for segments...")
        page.wait_for_selector("text=Segment 1: This is a simulated transcript segment")

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification.png")
        print("Screenshot taken.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
