import sys
import time
import logging
import argparse
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import JavascriptException

def configure_logging() -> logging.Logger:
    logger = logging.getLogger("selenium_debug")
    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler(sys.stderr)
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    if not logger.handlers:
        logger.addHandler(handler)
    logger.debug("Logger configured")
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
        result = func(*args, **kwargs)
        if logger:
            logger.debug(f"Executed {func.__name__} successfully: {result}")
        return result
    except Exception as e:
        if logger:
            logger.exception(f"Error executing {func.__name__}: {e}")
        return default

def fetch_browser_logs(driver: webdriver.Chrome, logger: logging.Logger):
    logs = safe_execute(driver.get_log, 'browser', logger, default=[])
    for entry in logs:
        level = getattr(logging, entry['level'].upper(), logging.INFO)
        logger.log(level, f"Browser log: {entry['message']}")
    if len(logs):
        logger.debug(f"Fetched {len(logs)} browser log entries")

def is_driver_alive(driver: webdriver.Chrome) -> bool:
    try:
        _ = driver.title
        return True
    except Exception:
        return False

def countdown_wait(seconds: int, logger: logging.Logger):
    logger.debug("Waiting for %d seconds...", seconds)
    for i in range(seconds, 0, -1):
        logger.debug("Countdown: %d", i)
        time.sleep(1)
    logger.debug("Wait complete.")

def wait_for_condition(driver: webdriver.Chrome, condition_script: str, logger: logging.Logger, timeout: int = 3600) -> bool:
    logger.debug(f"Waiting for JS condition with timeout={timeout} seconds...")
    start_time = time.time()
    try:
        for second in range(timeout):
            if not is_driver_alive(driver):
                logger.warning("WebDriver is dead, aborting wait.")
                return False
            result = safe_execute(driver.execute_script, condition_script, logger, default=False)
            if result:
                logger.debug(f"Condition met after {second} seconds.")
                return True
            if second % 5 == 0:
                logger.debug(f"Waiting... {second}/{timeout}")
            fetch_browser_logs(driver, logger)
            countdown_wait(1, logger)
    except KeyboardInterrupt:
        logger.warning("KeyboardInterrupt detected, exiting wait loop.")
        return False
    except Exception as e:
        logger.exception(f"Error during wait_for_condition: {e}")
        return False
    logger.warning("Timeout reached without meeting condition.")
    return False

def wait_for_exit_code(driver, logger, timeout=1200):
    logger.debug("====== Waiting for hidden exit code element ======")
    start = time.time()
    k = 0
    while time.time() - start < timeout:
        try:
            code = driver.execute_script("""
                var el = document.getElementById("___run_tests___exit_code_automated_return_code");
                return el ? el.textContent : null;
            """)
        except JavascriptException:
            code = None

        logger.debug(f"Poll result: {code} ({k})")
        fetch_browser_logs(driver, logger)
        if code is not None and code != "":
            logger.debug(f"Exit code found: {code}")
            return int(code)
        time.sleep(1)
        k = k + 1
    raise TimeoutError("Timeout while waiting for run_tests exit code")

def safe_switch_to_window(driver, handle):
    if handle in driver.window_handles:
        driver.switch_to.window(handle)
        return True
    else:
        print(f"Window {handle} is already closed")
        return False

def exit_with_error(message: str, logger: logging.Logger = None) -> int:
    if logger:
        logger.error(message)
    print('Error:', message, file=sys.stderr)
    return 255

def safe_quit(driver: webdriver.Chrome, logger: logging.Logger):
    logger.debug("Quitting WebDriver...")
    try:
        driver.quit()
        logger.debug("WebDriver quit successfully")
    except Exception:
        logger.warning("Exception occurred while quitting WebDriver, ignoring.")

def main() -> int:
    parser = argparse.ArgumentParser(description="Run Selenium test script with debug logging")
    parser.add_argument('--url', type=str, default='http://localhost:1122/?run_tests=0', help='URL to load')
    parser.add_argument('--headless', action='store_true', help='Run Chrome headless')
    parser.add_argument('--timeout', type=int, default=3600, help='Timeout in seconds')
    args = parser.parse_args()

    logger = configure_logging()
    logger.debug(f"Args parsed: {args}")
    options = create_chrome_options(headless=args.headless)
    driver = create_webdriver(options, logger)

    try:
        logger.debug(f"Loading about:blank...")
        driver.get("about:blank")

        for handle in driver.window_handles:
            safe_switch_to_window(driver, handle)

        countdown_wait(1, logger)

        logger.debug(f"Navigating to {args.url}...")
        driver.get(args.url)

        for handle in driver.window_handles:
            safe_switch_to_window(driver, handle)

        logger.debug("Waiting for exit code...")
        ret = wait_for_exit_code(driver, logger, args.timeout)
        logger.debug(f"Got exit code: {ret}")

        fetch_browser_logs(driver, logger)
        return ret
    except Exception as e:
        return exit_with_error(str(e), logger)
    finally:
        safe_quit(driver, logger)

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("You pressed CTRL-C", file=sys.stderr)
        sys.exit(1)
