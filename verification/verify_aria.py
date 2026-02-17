from playwright.sync_api import Page, expect, sync_playwright

def verify_aria_labels():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # 1. Navigate to the verification page
            print("Navigating to /verify-config")
            page.goto("http://localhost:3000/verify-config")

            # 2. Wait for the config panel to load
            print("Waiting for page content")
            expect(page.get_by_text("Verify Config Panel")).to_be_visible()

            # 3. Wait for sliders to be present
            print("Waiting for sliders")
            # Using locator directly to wait
            slider_locator = page.locator("[role='slider']")
            try:
                expect(slider_locator.first).to_be_visible(timeout=10000)
            except Exception as e:
                print(f"Error waiting for slider: {e}")
                print(page.content()) # Print content for debugging
                page.screenshot(path="verification/error_screenshot.png")
                raise e

            # Get all sliders
            sliders = slider_locator.all()
            print(f"Found {len(sliders)} sliders")

            if len(sliders) < 3:
                # Maybe wait a bit more? Or check if they are hidden
                print("Checking visibility of sliders")
                for i in range(len(sliders)):
                    print(f"Slider {i} visible: {sliders[i].is_visible()}")

                if len(sliders) < 3:
                     # If still not found, try finding by other attributes
                     print("Trying to find by class .block.size-4")
                     thumbs = page.locator(".block.size-4").all()
                     print(f"Found {len(thumbs)} thumbs by class")
                     if len(thumbs) >= 3:
                         sliders = thumbs # Use these instead
                     else:
                         raise Exception(f"Expected at least 3 sliders, found {len(sliders)}")

            # Verify each slider has an aria-label and aria-valuetext
            for i, slider in enumerate(sliders):
                label = slider.get_attribute("aria-label")
                valuetext = slider.get_attribute("aria-valuetext")
                print(f"Slider {i}: aria-label='{label}', aria-valuetext='{valuetext}'")

                if not label:
                    print(f"FAIL: Slider {i} missing aria-label")
                if not valuetext:
                    print(f"FAIL: Slider {i} missing aria-valuetext")

            # 4. Take a screenshot
            page.screenshot(path="verification/aria_verification.png")
            print("Verification complete, screenshot saved.")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_aria_labels()
