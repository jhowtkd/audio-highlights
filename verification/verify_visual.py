from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        print("Navigating to http://localhost:3000/research-poc...")
        page.goto("http://localhost:3000/research-poc")

        # Wait for segments to render
        print("Waiting for segments...")
        page.wait_for_selector("text=This is segment number 0")

        # Take a screenshot of the initial state
        page.screenshot(path="verification/initial.png")

        # Focus the first segment (which is now a button)
        print("Focusing segment 0...")
        # Locate the button that contains the text
        locator = page.locator("button:has-text('This is segment number 0')")
        locator.focus()

        # Take a screenshot of the focused state
        page.screenshot(path="verification/focused.png")
        print("Screenshots taken.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
