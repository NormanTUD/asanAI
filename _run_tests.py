import time
import sys
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()

# Chrome options
options = Options()
options.headless = False  # Set to True for headless mode
service = Service()

# Set up Chrome driver
driver = webdriver.Chrome(service=service, options=options)

# Set script timeout
driver.set_script_timeout(3600)

# Function to retrieve browser console logs
def log_browser_console():
    logs = driver.get_log('browser')
    for entry in logs:
        logger.log(getattr(logging, entry['level'].upper(), logging.INFO), entry['message'])

# Start by opening the page
driver.get('http://localhost:1122/')

try:
    finished_loading = False
    for _ in range(3600):
        finished_loading = driver.execute_script('return window.finished_loading === true')
        if finished_loading:
            break
        log_browser_console()
        time.sleep(1)

    if not finished_loading:
        raise Exception("Timeout waiting for page to load.")

    driver.execute_script(
        "window.test_done=false;window.test_result=null;"
        "run_tests().then(r=>{window.test_result=r;window.test_done=true;})"
        ".catch(()=>{window.test_result=1;window.test_done=true;});"
    )

    test_done = False
    for _ in range(3600):
        test_done = driver.execute_script("return window.test_done === true;")
        if test_done:
            break
        log_browser_console()
        time.sleep(1)

    if not test_done:
        raise Exception("Timeout waiting for tests to finish.")

    result = driver.execute_script("return window.test_result;")
    print('exit-code:', result)

    log_browser_console()
    sys.exit(result)
except Exception as e:
    print('Error:', str(e))
    sys.exit(255)
finally:
    driver.quit()
