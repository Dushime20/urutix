
import sys
import re

def check_balance_to_line(filename, limit):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    # Remove strings
    content = re.sub(r"'[^']*'", "''", content)
    content = re.sub(r'"[^"]*"', '""', content)
    content = re.sub(r'`[^`]*`', '``', content)
    
    lines = content.split('\n')
    balance = 0
    for i in range(min(limit, len(lines))):
        line = lines[i]
        for char in line:
            if char == '{':
                balance += 1
            elif char == '}':
                balance -= 1
        # print(f"Line {i+1}: balance={balance}")
    
    print(f"Balance at line {limit}: {balance}")

if __name__ == "__main__":
    check_balance_to_line(sys.argv[1], int(sys.argv[2]))
