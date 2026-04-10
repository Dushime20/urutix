
import sys
import re

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    # Remove strings (simplified, might fail on escaped quotes but usually ok for this)
    content = re.sub(r"'[^']*'", "''", content)
    content = re.sub(r'"[^"]*"', '""', content)
    content = re.sub(r'`[^`]*`', '``', content)
    
    stack = []
    for i, char in enumerate(content):
        if char == '{':
            stack.append('{')
        elif char == '}':
            if not stack:
                print("Extra '}' found")
            else:
                stack.pop()
    
    if stack:
        print(f"Unclosed braces: {len(stack)}")
    else:
        print("Braces are balanced (ignoring comments/strings)")

if __name__ == "__main__":
    check_balance(sys.argv[1])
