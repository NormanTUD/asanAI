import asyncio
from pyppeteer import launch

# ANSI color codes for console messages
COLOR_RED = '\033[91m'
COLOR_YELLOW = '\033[93m'
COLOR_GRAY = '\033[90m'
COLOR_RESET = '\033[0m'

async def main():
    browser = await launch(headless=False)  # Hier setzen wir headless auf False
    page = await browser.newPage()

    # Define an asynchronous function to handle console messages and print them in Python
    async def console_handler(msg):
        msg_text = msg.text
        msg_type = msg.type

        if msg_type == 'log':
            debug_message = f'{COLOR_GRAY}Debug: Executing {msg_text}{COLOR_RESET}'
            msg_text = f'{COLOR_RESET}{msg_text}{COLOR_RESET}'
        elif msg_type == 'warning':
            debug_message = f'{COLOR_GRAY}Debug: Warning - {msg_text}{COLOR_RESET}'
            msg_text = f'{COLOR_YELLOW}{msg_text}{COLOR_RESET}'
        elif msg_type == 'error':
            debug_message = f'{COLOR_GRAY}Debug: Error - {msg_text}{COLOR_RESET}'
            msg_text = f'{COLOR_RED}{msg_text}{COLOR_RESET}'
        else:
            debug_message = f'{COLOR_GRAY}Debug: {msg_type.capitalize()} - {msg_text}{COLOR_RESET}'
            msg_text = f'{COLOR_YELLOW}{msg_text}{COLOR_RESET}'

        # Print debug message before each console message
        print(debug_message)

        # Print the colored console message
        print(msg_text)

    # Add the console handler to the page
    page.on('console', console_handler)

    # Navigate to the specified URL
    await page.goto('http://localhost/TensorFlowJS-GUI/')

    try:
        # Increase the timeout for waiting to 20 minutes (1,200,000ms)
        await page.waitForFunction('window.finished_loading === true', timeout=1200000)

        # Execute the JavaScript function and retrieve its return value
        result = await page.evaluate('run_tests()')

        # Print the result to the console (you can log it or process it further)
        print("Result:", result)

    except Exception as e:
        # Handle any errors that occur during execution
        error_message = f'{COLOR_RED}Error: {str(e)}{COLOR_RESET}'
        print(error_message)

    finally:
        await browser.close()

if __name__ == '__main__':
    asyncio.get_event_loop().run_until_complete(main())
