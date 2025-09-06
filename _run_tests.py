import sys
import time
import logging
import argparse
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

def configure_logging() -> logging.Logger:
    logger = logging.getLogger("selenium_debug")
    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler(sys.stderr)
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    if not logger.handlers:
        logger.addHandler(handler)
    return logger

def create_chrome_options(headless: bool = False) -> Options:
    opts = Options()

    opts.add_argument("--auto-open-devtools-for-tabs")
    opts.add_argument("--start-maximized")

    opts.headless = headless
    return opts

def create_webdriver(options: Options, logger: logging.Logger) -> webdriver.Chrome:
    logger.debug("Starting Chrome WebDriver...")
    service = Service()
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_script_timeout(3600)
    logger.debug("WebDriver started successfully")
    return driver

def safe_execute(func, *args, logger: logging.Logger = None, default=None, **kwargs):
    try:
        return func(*args, **kwargs)
    except Exception as e:
        if logger:
            logger.exception(f"Error executing {func.__name__}: {e}")
        return default

def fetch_browser_logs(driver: webdriver.Chrome, logger: logging.Logger):
    logs = safe_execute(driver.get_log, 'browser', logger, default=[])
    for entry in logs:
        level = getattr(logging, entry['level'].upper(), logging.INFO)
        logger.log(level, f"Browser log: {entry['message']}")

def is_driver_alive(driver: webdriver.Chrome) -> bool:
    try:
        driver.title
        return True
    except Exception:
        return False

def wait_for_condition(driver: webdriver.Chrome, condition_script: str, logger: logging.Logger, timeout: int = 3600) -> bool:
    logger.debug(f"Waiting for condition with timeout={timeout} seconds...")
    try:
        for second in range(timeout):
            if not is_driver_alive(driver):
                logger.warning("WebDriver is dead, aborting wait.")
                return False
            result = safe_execute(driver.execute_script, condition_script, logger, default=False)
            if result:
                logger.debug(f"Condition met after {second} seconds.")
                return True
            if second % 5 == 0:  # alle 5 Sekunden Debug-Info
                logger.debug(f"Waiting... {second}/{timeout}")
            fetch_browser_logs(driver, logger)
            countdown_wait(2, logger)
    except KeyboardInterrupt:
        logger.warning("KeyboardInterrupt detected, exiting wait loop.")
        return False
    except Exception as e:
        logger.exception(f"Error during wait_for_condition: {e}")
        return False
    logger.warning("Timeout reached without meeting condition.")
    return False

def raise_timeout_error(message: str):
    raise Exception(message)

def countdown_wait(seconds: int, logger: logging.Logger) -> None:
    logger.debug("Waiting for %d seconds before starting tests...", seconds)
    for i in range(seconds, 0, -1):
        logger.debug("%d", i)
        time.sleep(1)
    logger.debug("Starting now.")

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from selenium.common.exceptions import JavascriptException

def wait_for_exit_code(driver, logger, timeout=1200):
    logger.debug("====== Waiting for hidden exit code element ======")
    start = time.time()
    while time.time() - start < timeout:
        try:
            code = driver.execute_script("""
                var el = document.getElementById("___run_tests___exit_code_automated_return_code");
                return el ? el.textContent : null;
            """)
        except JavascriptException:
            code = None

        logger.debug(f"====== Poll result: {code}")
        if code is not None and code != "":
            return int(code)
        time.sleep(1)

    raise TimeoutError("Timeout while waiting for run_tests exit code")


def exit_with_result(driver: webdriver.Chrome, logger: logging.Logger) -> None:
    logger.debug(f"Exiting with result {result}")
    fetch_browser_logs(driver, logger)

def exit_with_error(message: str, logger: logging.Logger = None) -> int:
    if logger:
        logger.error(message)
    print('Error:', message, file=sys.stderr)
    return 255

def safe_quit(driver: webdriver.Chrome, logger: logging.Logger):
    logger.debug("Quitting WebDriver...")
    try:
        driver.quit()
    except Exception:
        logger.warning("Exception occurred while quitting WebDriver, ignoring.")

def main() -> int:
    parser = argparse.ArgumentParser(description="Run Selenium test script with debug logging")
    parser.add_argument('--url', type=str, default='http://localhost:1122/?run_tests=1', help='URL to load')
    parser.add_argument('--headless', action='store_true', help='Run Chrome headless')
    parser.add_argument('--timeout', type=int, default=3600, help='Timeout in seconds')
    args = parser.parse_args()

    logger = configure_logging()
    options = create_chrome_options(headless=args.headless)
    driver = create_webdriver(options, logger)

    try:
        logger.debug(f"Loading about:blank...")
        driver.get("about:blank")
        logger.debug(f"Loaded about:blank. Sleeping 1 second...")
        countdown_wait(2, logger)

        logger.debug(f"Navigating to {args.url}...")
        driver.get(args.url)
        logger.debug("After navigating to URL.")

        logger.debug("Waiting for exit code...")
        ret = wait_for_exit_code(driver, logger, 3600)
        logger.debug("Get exit code...")

        logger.debug("Before exiting with result...")
        exit_with_result(driver, result, logger)
        logger.debug("After exiting with result.")  # wird wahrscheinlich nie erreicht

        return ret
    except Exception as e:
        return exit_with_error(str(e), logger)
    finally:
        safe_quit(driver, logger)

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("You pressed CTRL-C")
        sys.exit(1)
