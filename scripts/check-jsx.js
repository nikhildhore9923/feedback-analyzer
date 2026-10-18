const fs = require('fs');

function checkFile(filePath) {
  console.log(`Checking ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract all JSX tags <PascalCase ...>
  const jsxTags = [...content.matchAll(/<([A-Z][a-zA-Z0-9]+)/g)].map(m => m[1]);
  const uniqueTags = [...new Set(jsxTags)];

  // Extract imports across whole content (including multi-line)
  const importedIdentifiers = new Set();
  const definedIdentifiers = new Set();

  const importRegex = /import\s+(?:([\w\d_]+)\s*,?\s*)?(?:\{([^}]+)\})?\s+from\s+['"][^'"]+['"]/gs;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    if (match[1]) importedIdentifiers.add(match[1].trim());
    if (match[2]) {
      match[2].split(',').forEach(s => {
        const parts = s.trim().split(/\s+as\s+/);
        if (parts[parts.length - 1].trim()) {
          importedIdentifiers.add(parts[parts.length - 1].trim());
        }
      });
    }
  }

  // Also components passed as props, e.g. icon: Icon
  definedIdentifiers.add('Icon');

  const lines = content.split('\n');
  for (const line of lines) {
    const funcMatch = line.match(/function\s+([A-Z][a-zA-Z0-9]+)/);
    if (funcMatch) definedIdentifiers.add(funcMatch[1]);
    const constMatch = line.match(/(?:const|let|var)\s+([A-Z][a-zA-Z0-9]+)\s*=/);
    if (constMatch) definedIdentifiers.add(constMatch[1]);
  }

  const missing = uniqueTags.filter(t => !importedIdentifiers.has(t) && !definedIdentifiers.has(t));
  if (missing.length > 0) {
    console.error(`[ERROR] In ${filePath}, missing JSX elements:`, missing);
  } else {
    console.log(`[PASS] In ${filePath}, all ${uniqueTags.length} JSX components are imported or defined.`);
  }
}

checkFile('frontend/src/pages/Dashboard.jsx');
checkFile('frontend/src/pages/Reviews.jsx');
checkFile('frontend/src/pages/Settings.jsx');
checkFile('frontend/src/pages/Login.jsx');
checkFile('frontend/src/pages/Signup.jsx');
checkFile('frontend/src/components/Nav.jsx');
