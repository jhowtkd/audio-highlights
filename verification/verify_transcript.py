import time
from playwright.sync_api import sync_playwright

def verify_transcript():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Wait for server to be up (naive wait, but usually enough if we retry)
        # We can loop until connection is successful
        url = "http://localhost:3000/verify-perf"

        print(f"Navigating to {url}...")

        # Simple retry loop
        for i in range(30):
            try:
                page.goto(url)
                break
            except Exception as e:
                print(f"Waiting for server... ({i})")
                time.sleep(2)

        # Wait for content to load
        page.wait_for_selector("text=Transcript Viewer Performance Verification")

        # Verify initial state
        page.wait_for_selector("text=This is segment number 0")

        # Interact: Click Next to change active segment
        page.click("text=Next")

        # Verify active segment index updated (we can check the span)
        page.wait_for_selector("text=Active Index: 1")

        # Take screenshot
        screenshot_path = "verification/transcript_viewer.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_transcript()
