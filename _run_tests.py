import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

# Set up Chrome options
options = Options()
options.headless = False  # Set to True for headless mode
service = Service() #'/path/to/chromedriver')  # Path to chromedriver

# Start the browser
driver = webdriver.Chrome(service=service, options=options)

driver.set_script_timeout(3600)

# Navigate to localhost
driver.get('http://localhost:1122/TensorFlowJS-GUI/')

try:
    # Wait for window.finished_loading to be true (timeout in seconds)
    finished_loading = False
    for _ in range(1200):  # 20 minutes max
        finished_loading = driver.execute_script('return window.finished_loading === true')
        if finished_loading:
            break
        time.sleep(1)

    if not finished_loading:
        raise Exception("Timeout waiting for page to load.")

    # Execute the run_tests function and get the result
    result = driver.execute_script('return run_tests(1);')
    print('Result:', result)

    sys.exit(result)

except Exception as e:
    print('Error:', str(e))

    sys.exit(255)

finally:
    driver.quit()
