
import os
import re

def fix_imports(base_dir):
    ts_files = []
    for root, dirs, files in os.walk(base_dir):
        if "__tests__" in root:
            continue
        for file in files:
            if file.endswith(".ts"):
                ts_files.append(os.path.join(root, file))

    print(f"Synchronizing depths for {len(ts_files)} files...")

    for file_path in ts_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            rel_path = os.path.relpath(file_path, base_dir)
            # depth 0: src/main.ts
            # depth 1: src/entities/user.entity.ts
            # depth 2: src/modules/auth/auth.module.ts
            # depth 3: src/modules/auth/services/enhanced-auth.service.ts
            depth = len(rel_path.split(os.sep)) - 1
            
            # Entities prefix (relative to src)
            prefix = "../" * depth
            
            # If depth 1 (i.e. in entities folder itself), use './' for siblings
            if depth == 1 and rel_path.startswith("entities" + os.sep):
                entity_prefix = "./"
            else:
                entity_prefix = prefix + "entities/"
                
            common_prefix = prefix + "common/"
            service_prefix = prefix + "services/"
            module_prefix = prefix + "modules/"

            modified = False
            
            # 1. Standardize entities
            # Matches any existing relative path that leads into entities/ or any leftover @/
            # (Matches leading dots, slashes, or @ before entities/)
            pattern_e = r"(['\"])(@|(\.{1,2}/)+)entities/"
            sub_e = fr"\1{entity_prefix}"
            new_content = re.sub(pattern_e, sub_e, content)
            
            # 2. Standardize common
            pattern_c = r"(['\"])(@|(\.{1,2}/)+)common/"
            sub_c = fr"\1{common_prefix}"
            new_content = re.sub(pattern_c, sub_c, new_content)

            # 3. Standardize services
            pattern_s = r"(['\"])(@|(\.{1,2}/)+)services/"
            sub_s = fr"\1{service_prefix}"
            new_content = re.sub(pattern_s, sub_s, new_content)
            
            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Synchronized ({depth} depth): {rel_path}")

        except Exception as e:
            print(f"Error in {file_path}: {e}")

if __name__ == "__main__":
    src_dir = "C:/Users/HP/Desktop/urutix/urutix/backend/src"
    fix_imports(src_dir)
