from playwright.sync_api import sync_playwright, Page, expect
import re

def run_verification(page: Page):
    """
    This script verifies the hamburger menu functionality on mobile and desktop.
    """
    # 1. Navigate to the homepage.
    page.goto("http://localhost:3000")

    # 2. Mobile view verification
    page.set_viewport_size({"width": 375, "height": 812})
    page.wait_for_load_state("networkidle")
    # In mobile, the menu should be visible by default.
    mobile_menu = page.locator('div.md\\:hidden >> nav')
    expect(mobile_menu).to_be_visible()
    page.screenshot(path="jules-scratch/verification/mobile_view.png")

    # 3. Desktop view verification (menu closed)
    page.set_viewport_size({"width": 1280, "height": 800})
    page.wait_for_load_state("networkidle")
    # The hamburger button should be visible
    hamburger_button = page.get_by_role("button", name="Toggle Menu")
    expect(hamburger_button).to_be_visible()
    # The menu itself should be hidden
    desktop_menu = page.locator('div.hidden.md\\:block.fixed.bg-white')
    expect(desktop_menu).to_have_class(re.compile(r'-translate-x-full'))
    page.screenshot(path="jules-scratch/verification/desktop_view_closed.png")

    # 4. Desktop view verification (menu open)
    hamburger_button.click()
    # The menu should now be visible
    expect(desktop_menu).to_have_class(re.compile(r'translate-x-0'))
    page.wait_for_timeout(500) # wait for animation
    page.screenshot(path="jules-scratch/verification/desktop_view_open.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()
