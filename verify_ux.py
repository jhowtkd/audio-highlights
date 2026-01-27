from playwright.sync_api import sync_playwright, expect
import os

def run():
    os.makedirs("/home/jules/verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock the search API
        page.route("**/api/search", lambda route: route.fulfill(
            status=200,
            json={
                "results": [
                    {
                        "segmentId": "1",
                        "text": "Olá, bem-vindos ao podcast.",
                        "startTime": 0,
                        "endTime": 5,
                        "relevanceScore": 0.9,
                        "matchReason": "Mock match"
                    }
                ]
            }
        ))

        print("Navigating to test page...")
        page.goto("http://localhost:3000/test-ux")

        # 1. Check Transcript Segments are buttons
        print("Checking transcript segments...")
        # The segments in the main list
        segments = page.locator("button.text-left").filter(has_text="bem-vindos")
        expect(segments.first).to_be_visible()
        expect(segments.first).to_have_attribute("type", "button")

        # 2. Check Clear Search Button
        print("Checking clear search...")
        search_input = page.get_by_placeholder("Busca semântica...")
        search_input.fill("dinheiro")

        # Button should appear
        clear_btn = page.locator("button[aria-label='Limpar busca']")
        expect(clear_btn).to_be_visible()

        # 3. Check Search Results
        print("Checking search results...")
        search_btn = page.get_by_role("button", name="Buscar")
        search_btn.click()

        # Wait for search results
        # Search results replace the list.
        # They should also be buttons.
        results_container = page.locator("button.text-left").filter(has_text="Mock match")
        expect(results_container.first).to_be_visible()
        expect(results_container.first).to_have_attribute("type", "button")

        # Take screenshot
        page.screenshot(path="/home/jules/verification/verification.png")
        print("Screenshot saved to /home/jules/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run()
