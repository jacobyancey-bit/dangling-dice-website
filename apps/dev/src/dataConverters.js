// ============================================================================
// Dangling Dice Dev Suite™ — Data Transformation & Schema Converters Module
// JSON to TypeScript/Dart/Pydantic, Regex Bench with ReDoS Defense, & JWT Debugger
// ============================================================================

/**
 * 1. JSON to Strongly-Typed Code Generator
 */
export function jsonToTypescript(jsonObj, rootName = 'RootModel') {
  const interfaces = [];

  function inferType(val, keyName) {
    if (val === null) return 'any | null';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]';
      const itemType = inferType(val[0], `${keyName}Item`);
      return `${itemType}[]`;
    }
    if (typeof val === 'object') {
      const nestedName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
      parseObject(val, nestedName);
      return nestedName;
    }
    return typeof val;
  }

  function parseObject(obj, name) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    const lines = [];
    lines.push(`export interface ${name} {`);
    for (const [key, val] of Object.entries(obj)) {
      const isOptional = val === null || val === undefined;
      const typeStr = inferType(val, key);
      lines.push(`  ${key}${isOptional ? '?' : ''}: ${typeStr};`);
    }
    lines.push('}');
    interfaces.unshift(lines.join('\n'));
  }

  parseObject(jsonObj, rootName);
  return interfaces.join('\n\n');
}

export function jsonToDart(jsonObj, rootName = 'RootModel') {
  const classes = [];

  function dartType(val, keyName) {
    if (val === null) return 'dynamic';
    if (typeof val === 'string') return 'String';
    if (typeof val === 'boolean') return 'bool';
    if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'double';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'List<dynamic>';
      const inner = dartType(val[0], `${keyName}Item`);
      return `List<${inner}>`;
    }
    if (typeof val === 'object') {
      const nestedName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
      parseClass(val, nestedName);
      return nestedName;
    }
    return 'dynamic';
  }

  function parseClass(obj, name) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    const fields = [];
    const fromJsonLines = [];
    const toJsonLines = [];

    for (const [key, val] of Object.entries(obj)) {
      const t = dartType(val, key);
      fields.push(`  final ${t} ${key};`);
      fromJsonLines.push(`      ${key}: json['${key}'],`);
      toJsonLines.push(`      '${key}': ${key},`);
    }

    const classCode = `class ${name} {
${fields.join('\n')}

  ${name}({
${Object.keys(obj).map((k) => `    required this.${k},`).join('\n')}
  });

  factory ${name}.fromJson(Map<String, dynamic> json) => ${name}(
${fromJsonLines.join('\n')}
  );

  Map<String, dynamic> toJson() => {
${toJsonLines.join('\n')}
  };
}`;
    classes.unshift(classCode);
  }

  parseClass(jsonObj, rootName);
  return classes.join('\n\n');
}

export function jsonToPydantic(jsonObj, rootName = 'RootModel') {
  const models = [];

  function pyType(val, keyName) {
    if (val === null) return 'Optional[Any] = None';
    if (typeof val === 'string') return 'str';
    if (typeof val === 'boolean') return 'bool';
    if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'List[Any]';
      const inner = pyType(val[0], `${keyName}Item`);
      return `List[${inner}]`;
    }
    if (typeof val === 'object') {
      const nestedName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
      parseModel(val, nestedName);
      return nestedName;
    }
    return 'Any';
  }

  function parseModel(obj, name) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    const fields = [];
    for (const [key, val] of Object.entries(obj)) {
      const t = pyType(val, key);
      fields.push(`    ${key}: ${t}`);
    }

    const code = `class ${name}(BaseModel):
${fields.join('\n')}`;
    models.unshift(code);
  }

  parseModel(jsonObj, rootName);
  return `from typing import List, Optional, Any\nfrom pydantic import BaseModel\n\n` + models.join('\n\n');
}

/**
 * 2. Regex Visualizer & ReDoS Analyzer
 */
export function analyzeRegex(patternStr, flags, testText) {
  let isRedosVulnerable = false;
  let redosReason = 'Linear execution complexity $O(n)$. Safe against catastrophic backtracking.';

  // Detect common ReDoS exponential antipatterns like (a+)+, ([a-z]+)*, (a|aa)+
  const redosPatterns = [
    /\([^\)]*[\+\*][^\)]*\)[\+\*]/,     // Nested quantifiers like (a+)+
    /\([^\)]*\|[^\)]*\)[\+\*]/,         // Alternation with overlap like (a|a)+
    /(\\w\+|\\[a-zA-Z]\+)[\+\*]/,      // Character class repetition like (\w+)+
  ];

  for (const rx of redosPatterns) {
    if (rx.test(patternStr)) {
      isRedosVulnerable = true;
      redosReason =
        'Dangerous ReDoS pattern: nested quantifier found. Evaluator could suffer exponential backtracking O(2^n) on non-matching strings, freezing the Node.js event loop.';
      break;
    }
  }

  const matches = [];
  try {
    const rx = new RegExp(patternStr, flags);
    if (flags.includes('g')) {
      let m;
      while ((m = rx.exec(testText)) !== null) {
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1),
        });
        if (m.index === rx.lastIndex) rx.lastIndex++;
      }
    } else {
      const m = rx.exec(testText);
      if (m) {
        matches.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1),
        });
      }
    }
    return { valid: true, matches, isRedosVulnerable, redosReason };
  } catch (err) {
    return { valid: false, error: err.message, matches: [], isRedosVulnerable, redosReason };
  }
}

/**
 * 3. JWT & Bearer Token Inspector
 */
export function decodeJwt(tokenStr) {
  const parts = tokenStr.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'A valid JWT must contain exactly 3 segments separated by dots (header.payload.signature).' };
  }

  function b64Decode(str) {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw new Error('Illegal base64url string!');
    }
    return decodeURIComponent(
      atob(output)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }

  try {
    const header = JSON.parse(b64Decode(parts[0]));
    const payload = JSON.parse(b64Decode(parts[1]));
    const signature = parts[2];

    let expRelative = 'No exp claim';
    let isExpired = false;
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      isExpired = now > expDate;
      const diffMin = Math.round((expDate - now) / 60000);
      expRelative = isExpired
        ? `Expired ${Math.abs(diffMin)} minutes ago (${expDate.toLocaleTimeString()})`
        : `Expires in ${diffMin} minutes (${expDate.toLocaleTimeString()})`;
    }

    return {
      valid: true,
      header,
      payload,
      signature,
      isExpired,
      expRelative,
    };
  } catch (err) {
    return { valid: false, error: `Malformed JWT base64 encoding: ${err.message}` };
  }
}

