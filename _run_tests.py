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

def safe_execute(func, *args, logger=None, default=None, **kwargs):
    try:
        return func(*args, **kwargs)
    except Exception as e:
        if logger:
            logger.exception(f"Error executing {func.__name__}: {e}")
        return default

def fetch_browser_logs(driver, logger):
    logs = safe_execute(driver.get_log, 'browser', logger, default=[])
    for entry in logs:
        level = getattr(logging, entry['level'].upper(), logging.INFO)
        logger.log(level, entry['message'])

def is_driver_alive(driver):
    try:
        driver.title  # simple command to see if session exists
        return True
    except Exception:
        return False

def wait_for_condition(driver, condition_script, logger, timeout=3600):
    try:
        for _ in range(timeout):
            if not is_driver_alive(driver):
                logger.warning("WebDriver is dead, aborting wait.")
                return False
            if safe_execute(driver.execute_script, condition_script, logger, default=False):
                return True
            fetch_browser_logs(driver, logger)
            time.sleep(1)
    except KeyboardInterrupt:
        logger.warning("KeyboardInterrupt detected, exiting wait loop.")
        return False
    except Exception as e:
        logger.exception(f"Error during wait_for_condition: {e}")
        return False
    return False

def raise_timeout_error(message):
    raise Exception(message)

def run_test_script(driver, logger):
    safe_execute(
        driver.execute_script,
        "window.test_done=false;window.test_result=null;"
        "run_tests().then(r=>{window.test_result=r;window.test_done=true;})"
        ".catch(()=>{window.test_result=1;window.test_done=true;});",
        logger=logger
    )

def get_test_result(driver, logger):
    return safe_execute(driver.execute_script, "return window.test_result;", logger=logger, default=1)

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

def safe_quit(driver):
    try:
        driver.quit()
    except Exception:
        pass

def main():
    logger = configure_logging()
    options = create_chrome_options(headless=False)
    driver = create_webdriver(options)

    try:
        driver.get('http://localhost:1122/')
        wait_for_page_load(driver, logger)
        run_test_script(driver, logger)
        wait_for_tests(driver, logger)
        result = get_test_result(driver, logger)
        return exit_with_result(driver, result, logger)
    except Exception as e:
        return exit_with_error(str(e))
    finally:
        safe_quit(driver)

if __name__ == "__main__":
    sys.exit(main())
