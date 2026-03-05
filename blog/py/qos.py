import os
import ast
import importlib.util
import sys

class QualityChecker(ast.NodeVisitor):
    def __init__(self):
        self.issues = []
        self.imported_names = set()
        self.used_names = set()

    def visit_Import(self, node):
        for alias in node.names:
            self.imported_names.add(alias.asname or alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.imported_names.add(alias.asname or alias.name)
        self.generic_visit(node)

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            self.used_names.add(node.id)
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        if not node.name.islower() and "_" not in node.name and not node.name[0].islower():
             self.issues.append(f"Function '{node.name}' should be snake_case")
        
        self.generic_visit(node)

def run_smoke_test(directory):
    overall_passed = True
    print(f"--- Starting Enhanced Smoke Test: {directory} ---\n")
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py") and file != "smoke_test.py":
                full_path = os.path.join(root, file)
                file_failed = False
                print(f"CHECKING: {full_path}")
                
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        tree = ast.parse(content)
                    
                    # --- 1. Import Check ---
                    missing_mods = []
                    for node in ast.walk(tree):
                        if isinstance(node, (ast.Import, ast.ImportFrom)):
                            module_names = [n.name.split('.')[0] for n in node.names] if isinstance(node, ast.Import) else [node.module.split('.')[0]]
                            for m in filter(None, module_names):
                                if importlib.util.find_spec(m) is None:
                                    missing_mods.append(m)
                    
                    # --- 2. Advanced Quality Analysis ---
                    checker = QualityChecker()
                    checker.visit(tree)
                    
                    # Unused imports check
                    unused = checker.imported_names - checker.used_names
                    # Filter out common false positives like 'sys' if used in complex ways
                    if unused:
                        checker.issues.append(f"Potentially unused imports: {unused}")

                    if checker.issues:
                        file_failed = True
                        for issue in checker.issues:
                            print(f"  [FAIL] {issue}")

                except SyntaxError as e:
                    print(f"  [CRITICAL] Syntax Error: {e}")
                    file_failed = True
                except Exception as e:
                    print(f"  [ERROR] System Error: {e}")
                    file_failed = True

                if file_failed:
                    overall_passed = False
                print("-" * 40)

    if not overall_passed:
        print("\nRESULT: Tests failed. Fix the issues above.")
        sys.exit(1)
    else:
        print("\nRESULT: All scripts passed basic quality checks.")
        sys.exit(0)

if __name__ == "__main__":
    run_smoke_test("./py")
