import sys
import time
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

def configure_logging():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    return logging.getLogger()

def create_chrome_options(headless=False):
    options = Options()
    options.headless = headless
    return options

def create_webdriver(options):
    service = Service()
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_script_timeout(3600)
    return driver

def fetch_browser_logs(driver, logger):
    logs = driver.get_log('browser')
    for entry in logs:
        level = getattr(logging, entry['level'].upper(), logging.INFO)
        logger.log(level, entry['message'])

def wait_for_condition(driver, condition_script, logger, timeout=3600):
    for _ in range(timeout):
        if driver.execute_script(condition_script):
            return True
        fetch_browser_logs(driver, logger)
        time.sleep(1)
    return False

def raise_timeout_error(message):
    raise Exception(message)

def run_test_script(driver):
    driver.execute_script(
        "window.test_done=false;window.test_result=null;"
        "run_tests().then(r=>{window.test_result=r;window.test_done=true;})"
        ".catch(()=>{window.test_result=1;window.test_done=true;});"
    )

def get_test_result(driver):
    return driver.execute_script("return window.test_result;")

def wait_for_page_load(driver, logger):
    loaded = wait_for_condition(driver, 'return window.finished_loading === true', logger)
    if not loaded:
        raise_timeout_error("Timeout waiting for page to load.")

def wait_for_tests(driver, logger):
    done = wait_for_condition(driver, 'return window.test_done === true', logger)
    if not done:
        raise_timeout_error("Timeout waiting for tests to finish.")

def exit_with_result(driver, result, logger):
    print('exit-code:', result)
    fetch_browser_logs(driver, logger)
    return result

def exit_with_error(message):
    print('Error:', message)
    return 255

def main():
    logger = configure_logging()
    options = create_chrome_options(headless=False)
    driver = create_webdriver(options)

    try:
        driver.get('http://localhost:1122/')
        wait_for_page_load(driver, logger)
        run_test_script(driver)
        wait_for_tests(driver, logger)
        result = get_test_result(driver)
        return exit_with_result(driver, result, logger)
    except Exception as e:
        return exit_with_error(str(e))
    finally:
        safe_quit(driver)

if __name__ == "__main__":
    sys.exit(main())
