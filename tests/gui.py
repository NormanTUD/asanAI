import sys
from selenium import webdriver
from selenium.webdriver.firefox.options import Options

options = Options()
options.headless = True
browser = webdriver.Firefox(options=options, executable_path=r'tests/geckodriver')

link = "http://localhost/tf"

browser.get(link)

ribbon = browser.find_element_by_id("ribbon")

exit_code = 0
if not "Home" in ribbon.text:
    print("FAILED: 'Home' not in ribbon")
    exit_code = 1



#if(is_text == should_be_text):
#    print("OK")
#    exit_code = 0
#else:
#    print("FAIL")

browser.quit()

sys.exit(exit_code)
