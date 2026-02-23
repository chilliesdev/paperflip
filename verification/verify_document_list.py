from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to home page
        page.goto("http://localhost:3000/")

        # Wait for page to load
        # page.wait_for_selector("text=Open PDF", timeout=30000)
        page.wait_for_load_state("networkidle")

        # Take screenshot of home page
        page.screenshot(path="verification/home.png")
        print(f"Title: {page.title()}")

        # Navigate to Library
        page.goto("http://localhost:3000/library")
        # page.wait_for_selector("text=All Documents", timeout=30000)
        page.wait_for_load_state("networkidle")

        # Take screenshot of library
        page.screenshot(path="verification/library.png")
        print(f"Library Title: {page.title()}")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
