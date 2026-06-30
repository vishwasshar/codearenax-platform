import * as babelParser from "@babel/parser";

export interface FunctionDef {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
}

export interface FunctionCall {
  name: string;
  callLine: number;
  arguments: string[];
}

export interface ImportDecl {
  source: string;
  specifiers: string[];
  startLine: number;
}

export interface AnalysisResult {
  functions: FunctionDef[];
  calls: FunctionCall[];
  imports: ImportDecl[];
  errors: string[];
}

export interface WorkerRequest {
  code: string;
  language: string;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { code, language } = e.data;
  const result = analyzeCode(code, language);
  self.postMessage(result);
};

function analyzeCode(code: string, language: string): AnalysisResult {
  const functions: FunctionDef[] = [];
  const calls: FunctionCall[] = [];
  const imports: ImportDecl[] = [];
  const errors: string[] = [];

  if (!code || !code.trim()) {
    return { functions, calls, imports, errors };
  }

  let ast: any;
  try {
    const isTS = language === "typescript" || language === "tsx" || language.endsWith("typescript");
    const plugins: any[] = [];

    if (isTS) {
      plugins.push("typescript");
      if (language === "tsx") plugins.push("jsx");
    } else {
      plugins.push("jsx");
    }

    ast = babelParser.parse(code, {
      sourceType: "unambiguous",
      plugins,
      errorRecovery: true,
      attachComment: false,
    });
  } catch (err: any) {
    errors.push(`Parse error: ${err.message}`);
    return { functions, calls, imports, errors };
  }

  if (!ast) {
    errors.push("Failed to produce AST");
    return { functions, calls, imports, errors };
  }

  try {
    walkAST(ast, functions, calls, imports);
  } catch (err: any) {
    errors.push(`Walk error: ${err.message}`);
  }

  return { functions, calls, imports, errors };
}

function walkAST(
  node: any,
  functions: FunctionDef[],
  calls: FunctionCall[],
  imports: ImportDecl[],
): void {
  if (!node || typeof node !== "object") return;

  const nodeType = node.type;

  if (nodeType === "FunctionDeclaration" && node.id) {
    functions.push({
      name: node.id.name,
      startLine: node.loc?.start?.line ?? 0,
      endLine: node.loc?.end?.line ?? 0,
      parameters: (node.params || []).map((p: any) => extractParamName(p)),
    });
  }

  if (nodeType === "FunctionExpression" || nodeType === "ArrowFunctionExpression") {
    if (node.id?.name) {
      functions.push({
        name: node.id.name,
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        parameters: (node.params || []).map((p: any) => extractParamName(p)),
      });
    }
  }

  if (nodeType === "VariableDeclarator" && node.init) {
    if (
      node.init.type === "ArrowFunctionExpression" ||
      node.init.type === "FunctionExpression"
    ) {
      if (node.id?.name) {
        functions.push({
          name: node.id.name,
          startLine: node.loc?.start?.line ?? 0,
          endLine: node.loc?.end?.line ?? 0,
          parameters: (node.init.params || []).map((p: any) => extractParamName(p)),
        });
      }
    }

    if (
      node.init.type === "CallExpression" &&
      node.init.callee?.type === "Identifier" &&
      node.init.callee.name === "require" &&
      node.init.arguments?.[0]?.type === "StringLiteral"
    ) {
      const source = node.init.arguments[0].value;
      const specifiers: string[] = [];
      if (node.id?.type === "ObjectPattern") {
        for (const prop of node.id.properties || []) {
          if (prop.type === "RestElement") {
            specifiers.push(`...${prop.argument?.name || ""}`);
          } else {
            const name = prop.key?.name || prop.value?.name || "";
            if (name) specifiers.push(name);
          }
        }
      } else if (node.id?.type === "Identifier") {
        specifiers.push(node.id.name);
      }
      if (source && specifiers.length > 0) {
        imports.push({
          source,
          specifiers,
          startLine: node.loc?.start?.line ?? 0,
        });
      }
    }
  }

  if (nodeType === "ExportDefaultDeclaration" && node.declaration) {
    const decl = node.declaration;
    if (
      decl.type === "FunctionDeclaration" ||
      decl.type === "FunctionExpression" ||
      decl.type === "ArrowFunctionExpression"
    ) {
      functions.push({
        name: decl.id?.name || "default",
        startLine: decl.loc?.start?.line ?? 0,
        endLine: decl.loc?.end?.line ?? 0,
        parameters: (decl.params || []).map((p: any) => extractParamName(p)),
      });
    }
  }

  if (
    nodeType === "CallExpression" &&
    node.callee &&
    (node.callee.type === "Identifier" ||
      node.callee.type === "MemberExpression")
  ) {
    let name = "";
    if (node.callee.type === "Identifier") {
      if (node.callee.name === "require") return;
      name = node.callee.name;
    } else if (
      node.callee.property?.type === "Identifier"
    ) {
      name = extractMemberExpressionName(node.callee);
    }

    if (name) {
      calls.push({
        name,
        callLine: node.loc?.start?.line ?? 0,
        arguments: (node.arguments || []).map((a: any) => extractArgName(a)),
      });
    }
  }

  if (
    nodeType === "ImportDeclaration" &&
    node.source
  ) {
    imports.push({
      source: node.source.value || "",
      specifiers: (node.specifiers || []).map((s: any) =>
        s.local?.name || s.imported?.name || "",
      ),
      startLine: node.loc?.start?.line ?? 0,
    });
  }

  for (const key of Object.keys(node)) {
    if (key === "leadingComments" || key === "trailingComments" || key === "innerComments") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        walkAST(item, functions, calls, imports);
      }
    } else {
      walkAST(child, functions, calls, imports);
    }
  }
}

function extractParamName(param: any): string {
  if (!param) return "";
  if (param.type === "Identifier") return param.name;
  if (param.type === "AssignmentPattern" && param.left) return extractParamName(param.left);
  if (param.type === "RestElement" && param.argument) return `...${extractParamName(param.argument)}`;
  if (param.type === "ObjectPattern" || param.type === "ArrayPattern") return param.type;
  return `param_${param.start}`;
}

function extractArgName(arg: any): string {
  if (!arg) return "";
  if (arg.type === "Identifier") return arg.name;
  if (arg.type === "StringLiteral") return `"${arg.value}"`;
  if (arg.type === "NumericLiteral" || arg.type === "BooleanLiteral") return String(arg.value);
  if (arg.type === "NullLiteral") return "null";
  if (arg.type === "TemplateLiteral") return "`...`";
  if (arg.type === "ArrowFunctionExpression" || arg.type === "FunctionExpression") return "fn";
  if (arg.type === "ObjectExpression") return "{...}";
  if (arg.type === "ArrayExpression") return "[...]";
  if (arg.type === "MemberExpression") return extractMemberExpressionName(arg);
  return arg.type || "";
}

function extractMemberExpressionName(expr: any): string {
  const parts: string[] = [];
  let current = expr;
  while (current) {
    if (current.type === "MemberExpression") {
      if (current.property?.type === "Identifier") {
        parts.unshift(current.property.name);
      } else if (current.property?.type === "StringLiteral") {
        parts.unshift(current.property.value);
      } else if (current.property) {
        parts.unshift("?");
      }
      current = current.object;
    } else if (current.type === "Identifier") {
      parts.unshift(current.name);
      break;
    } else {
      parts.unshift("?");
      break;
    }
  }
  return parts.join(".");
}
