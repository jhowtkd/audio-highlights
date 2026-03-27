from playwright.sync_api import sync_playwright
import time
import os
import subprocess

def run_cuj(page):
    # Crie uma página HTML local simples com os dados mockados
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Decupagem Test</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://unpkg.com/lucide@latest/lucide.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 p-8">
        <div id="root">
           <div class="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-lg border max-w-2xl mx-auto shadow-sm">
                <div class="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 class="font-semibold text-lg">Sugestões de Corte</h3>
                        <p class="text-xs text-gray-500">
                            Original: 120s → Limpo: 110s
                            <span class="ml-2 text-green-500 font-bold">(-10s)</span>
                        </p>
                    </div>
                </div>
                <div class="p-4 space-y-4">
                    <!-- Card 1 -->
                    <div class="mb-3 border-l-4 transition-all border-l-yellow-400 bg-white rounded-lg border shadow-sm">
                        <div class="p-4 pb-2">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex gap-2 items-center">
                                    <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-500 text-white">Vício de Ling.</span>
                                    <div class="text-xs text-gray-500 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        0:10 - 0:12 (1.5s)
                                    </div>
                                </div>
                            </div>
                            <p class="text-sm font-medium italic text-gray-500 mb-2">
                                "é... tipo assim"
                            </p>
                            <p class="text-xs text-gray-500">
                                <span class="font-semibold">Motivo:</span> Vício de linguagem desnecessário
                            </p>
                        </div>
                        <div class="p-2 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                            <button class="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 h-8 w-8 p-0" title="Manter (Ignorar corte)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                            <button class="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 h-8 w-8 p-0" title="Confirmar Corte">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-red-600"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    with open("/tmp/decupagem_test.html", "w") as f:
        f.write(html_content)

    page.goto(f"file:///tmp/decupagem_test.html")
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
