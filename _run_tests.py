import sys
import time
import logging
import argparse
from beartype import beartype
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

@beartype
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

@beartype
def create_chrome_options(headless: bool = False) -> Options:
    opts = Options()

    opts.add_argument("--auto-open-devtools-for-tabs")
    opts.add_argument("--start-maximized")

    opts.headless = headless
    return opts

@beartype
def create_webdriver(options: Options, logger: logging.Logger) -> webdriver.Chrome:
    logger.debug("Starting Chrome WebDriver...")
    service = Service()
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_script_timeout(3600)
    logger.debug("WebDriver started successfully")
    return driver

@beartype
def safe_execute(func, *args, logger: logging.Logger = None, default=None, **kwargs):
    try:
        return func(*args, **kwargs)
    except (ReadTimeoutError, Exception) as e:
        if logger:
            logger.exception(f"Error executing {func.__name__}: {e}")
        return default

@beartype
def fetch_browser_logs(driver: webdriver.Chrome, logger: logging.Logger):
    logs = safe_execute(driver.get_log, 'browser', logger, default=[])
    for entry in logs:
        level = getattr(logging, entry['level'].upper(), logging.INFO)
        logger.log(level, f"Browser log: {entry['message']}")

@beartype
def is_driver_alive(driver: webdriver.Chrome) -> bool:
    try:
        driver.title
        return True
    except Exception:
        return False

@beartype
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
            time.sleep(1)
    except KeyboardInterrupt:
        logger.warning("KeyboardInterrupt detected, exiting wait loop.")
        return False
    except Exception as e:
        logger.exception(f"Error during wait_for_condition: {e}")
        return False
    logger.warning("Timeout reached without meeting condition.")
    return False

@beartype
def raise_timeout_error(message: str):
    raise Exception(message)

@beartype
def run_test_script(driver: webdriver.Chrome, logger: logging.Logger) -> tuple[int, str | None]:
    logger.debug("Waiting for 10 seconds before starting tests...")

    time.sleep(10)

    logger.debug("Starting run_tests in browser with console.log...")

    js = """
    (async function(callback) {
        try {
            console.log("run_test_script: starting...");
            while (typeof window.run_tests !== "function") {
                console.log("run_test_script: waiting for run_tests...");
                await new Promise(r => setTimeout(r, 100));
            }
            console.log("run_test_script: run_tests found, calling...");
            const ret = await window.run_tests();
            console.log("run_test_script: run_tests finished with result:", ret);
            callback({result: ret === 0 ? 0 : 1, error: null});
        } catch(e) {
            console.error("run_test_script: Error in run_tests:", e);
            callback({result: 1, error: e.toString()});
        }
    })(arguments[0]);
    """
    res = safe_execute(
        driver.execute_async_script,
        js,
        logger=logger,
        default={"result": 1, "error": "JS execution failed"}
    )
    logger.debug("run_tests returned: %s", res)
    return res["result"], res["error"]

@beartype
def get_test_result(driver: webdriver.Chrome, logger: logging.Logger) -> int:
    result = safe_execute(driver.execute_script, "return window.test_result;", logger=logger, default=1)
    logger.debug(f"Test result obtained: {result}")
    return result

@beartype
def exit_with_result(driver: webdriver.Chrome, result: int, logger: logging.Logger) -> int:
    logger.debug(f"Exiting with result {result}")
    fetch_browser_logs(driver, logger)
    return result

@beartype
def exit_with_error(message: str, logger: logging.Logger = None) -> int:
    if logger:
        logger.error(message)
    print('Error:', message, file=sys.stderr)
    return 255

@beartype
def safe_quit(driver: webdriver.Chrome, logger: logging.Logger):
    logger.debug("Quitting WebDriver...")
    try:
        driver.quit()
    except Exception:
        logger.warning("Exception occurred while quitting WebDriver, ignoring.")

@beartype
def main() -> int:
    parser = argparse.ArgumentParser(description="Run Selenium test script with debug logging")
    parser.add_argument('--url', type=str, default='http://localhost:1122/', help='URL to load')
    parser.add_argument('--headless', action='store_true', help='Run Chrome headless')
    parser.add_argument('--timeout', type=int, default=3600, help='Timeout in seconds')
    args = parser.parse_args()

    logger = configure_logging()
    options = create_chrome_options(headless=args.headless)
    driver = create_webdriver(options, logger)

    try:
        logger.debug(f"Navigating to {args.url}...")
        driver.get(args.url)
        logger.debug("After navigating to URL.")

        logger.debug("Before running test script...")
        run_test_script(driver, logger)
        logger.debug("After running test script.")

        logger.debug("Before getting test result...")
        result = get_test_result(driver, logger)
        logger.debug(f"After getting test result: {result}")

        logger.debug("Before exiting with result...")
        ret = exit_with_result(driver, result, logger)
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
