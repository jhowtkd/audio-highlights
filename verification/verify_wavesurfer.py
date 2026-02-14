import os
import sys
from playwright.sync_api import sync_playwright

def verify_wavesurfer():
    url = "http://localhost:3000/research-poc/wavesurfer"
    print(f"Navigating to {url}...")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            page.goto(url, wait_until="networkidle")

            # Wait for the waveform container
            print("Waiting for waveform container...")
            page.wait_for_selector("#waveform", timeout=10000)

            # Check if wavesurfer is initialized (it creates a Shadow Root or a Wrapper)
            # v7 usually creates a wrapper div with class 'wavesurfer-wrapper' or similar,
            # or just puts a Shadow Root on the container.
            # Let's inspect the container.

            container = page.locator("#waveform")

            # Wait for inner content (canvas or shadow root)
            # If using Shadow DOM:
            # We can check if evaluate returns a shadow root
            has_shadow = page.evaluate("document.querySelector('#waveform').shadowRoot !== null")
            print(f"Has Shadow Root: {has_shadow}")

            if has_shadow:
                # Need to access shadow root
                # Playwright handles shadow DOM automatically in selectors usually, but sometimes not.
                # Let's check for 'canvas' or 'div' inside.
                # If shadow DOM is open.
                pass

            # Check for canvas (standard rendering)
            # Note: WaveSurfer v7 might put canvas in shadow DOM.
            # Let's try to find any canvas.
            canvas_count = page.locator("canvas").count()
            print(f"Canvas count on page: {canvas_count}")

            # If canvas count is 0, maybe it's inside shadow DOM.
            # Playwright selectors pierce open shadow roots by default.

            if canvas_count == 0:
                print("No canvas found directly. Checking inside shadow DOM...")
                # Try to find canvas inside #waveform
                # ' >> ' combinator pierces shadow dom? No, standard selectors do.
                # Maybe it's not ready yet?
                page.wait_for_timeout(2000) # Give it a bit more time for audio decoding
                canvas_count = page.locator("canvas").count()
                print(f"Canvas count after wait: {canvas_count}")

            # Check for Timeline
            timeline = page.locator("#timeline")
            print(f"Timeline visible: {timeline.is_visible()}")

            # Take screenshot
            if not os.path.exists("verification"):
                os.makedirs("verification")

            screenshot_path = "verification/wavesurfer_poc.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

            if canvas_count > 0 or has_shadow:
                print("SUCCESS: Waveform appears to be rendered.")
            else:
                print("FAILURE: No waveform canvas or shadow root found.")
                sys.exit(1)

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    verify_wavesurfer()
