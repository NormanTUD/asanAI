import os
import ast
import sys

# Toggle this via command line argument --debug
DEBUG = "--debug" in sys.argv

class QualityChecker(ast.NodeVisitor):
    def __init__(self):
        self.issues = []
        self.imported_names = {} # name -> lineno
        self.used_names = set()

    def visit_Import(self, node):
        for alias in node.names:
            name = alias.asname or alias.name
            self.imported_names[name] = node.lineno
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            name = alias.asname or alias.name
            self.imported_names[name] = node.lineno
        self.generic_visit(node)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            self.used_names.add(node.id)
        self.generic_visit(node)

    def visit_Attribute(self, node):
        if isinstance(node.value, ast.Name):
            self.used_names.add(node.value.id)
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        # PEP8 snake_case check
        if not node.name.islower() and "_" not in node.name and not node.name[0].islower():
             self.issues.append(f"Line {node.lineno}: Function '{node.name}' should be snake_case")
        self.generic_visit(node)

def run_smoke_test(directory):
    overall_passed = True
    found_any_issue = False
    
    if DEBUG:
        print(f"--- Scanning: {directory} ---")
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py") and file != "smoke_test.py":
                full_path = os.path.join(root, file)
                
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        tree = ast.parse(f.read())
                    
                    checker = QualityChecker()
                    checker.visit(tree)
                    
                    # Improved unused check: only flag if the name or its base isn't in used_names
                    unused = [name for name in checker.imported_names 
                              if name not in checker.used_names and name.split('.')[0] not in checker.used_names]
                    
                    if unused:
                        checker.issues.append(f"Unused imports: {unused}")

                    if checker.issues:
                        found_any_issue = True
                        overall_passed = False
                        print(f"FAIL: {full_path}")
                        for issue in checker.issues:
                            print(f"  - {issue}")
                    elif DEBUG:
                        print(f"OK:   {full_path}")

                except SyntaxError as e:
                    print(f"CRITICAL: {full_path} (Syntax Error: {e})")
                    overall_passed = False
                    found_any_issue = True
                except Exception as e:
                    if DEBUG: print(f"ERROR: {full_path} ({e})")

    if not overall_passed:
        if found_any_issue:
            print("\nRESULT: Quality checks failed.")
        sys.exit(1)
    else:
        if DEBUG: print("\nRESULT: All clear.")
        sys.exit(0)

if __name__ == "__main__":
    run_smoke_test("./py")
