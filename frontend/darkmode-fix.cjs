const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('c:/Users/user/Desktop/project/urutix/frontend/src/components/BrokerDashboard/**/*.tsx');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  const addDarkClass = (baseClass, darkClass) => {
    // Standard className="..."
    content = content.replace(/className=(['"])(.*?)\1/g, (match, quote, classes) => {
      const classArray = classes.split(/\s+/);
      if (classArray.includes(baseClass)) {
        const hasDarkEquivalent = classArray.some(c => c.startsWith('dark:' + baseClass.split('-')[0]));
        if (!hasDarkEquivalent) {
          classArray.push(darkClass);
        }
      }
      return 'className=' + quote + classArray.join(' ') + quote;
    });
    
    // Template literals className={`...`}
    content = content.replace(/className=\{`([^`]+)`\}/g, (match, classes) => {
      const classArray = classes.split(/\s+/);
      if (classArray.includes(baseClass)) {
        const hasDarkEquivalent = classArray.some(c => c.startsWith('dark:' + baseClass.split('-')[0]));
        if (!hasDarkEquivalent) {
          classArray.push(darkClass);
        }
      }
      return 'className={`' + classArray.join(' ') + '`}';
    });
  };

  addDarkClass('bg-white', 'dark:bg-slate-900');
  addDarkClass('bg-slate-50', 'dark:bg-slate-800/50');
  addDarkClass('text-slate-900', 'dark:text-white');
  addDarkClass('text-slate-700', 'dark:text-slate-200');
  addDarkClass('text-slate-600', 'dark:text-slate-300');
  addDarkClass('text-slate-500', 'dark:text-slate-400');
  addDarkClass('border-slate-100', 'dark:border-slate-800');
  addDarkClass('border-slate-50', 'dark:border-slate-800/50');
  addDarkClass('bg-slate-900', 'dark:bg-slate-950');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});
console.log('Fixed dark mode in ' + count + ' files.');
