// 패키지의 공개 파일·설명 주석·함수 간격·의존 방향을 검사하는 프로젝트 전용 린트 규칙입니다.
import path from 'node:path';

const metadata = (messageId, message, fixable) => ({
  type: 'suggestion',
  schema: [],
  messages: { [messageId]: message },
  ...(fixable ? { fixable } : {}),
});

const exportOnlyIndex = {
  meta: metadata('exportOnly', 'index.ts에는 다른 파일을 재수출하는 export 문만 작성해주세요.'),
  create(context) {
    return {
      Program(node) {
        for (const statement of node.body) {
          if (
            !['ExportNamedDeclaration', 'ExportAllDeclaration'].includes(statement.type) ||
            !statement.source
          ) {
            context.report({ node: statement, messageId: 'exportOnly' });
          }
        }
      },
    };
  },
};

const fileDescription = {
  meta: metadata('description', '파일 맨 위에 이 파일의 역할을 쉽게 설명하는 주석을 작성해주세요.'),
  create(context) {
    return {
      Program(node) {
        const source = context.sourceCode;
        const comment = source.getAllComments()[0];
        if (
          !comment ||
          comment.loc.start.line !== 1 ||
          source.text.slice(0, comment.range[0]).trim() ||
          comment.value.trim().length < 8
        ) {
          context.report({ node, messageId: 'description' });
        }
      },
    };
  },
};

function isFunction(node) {
  if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration')
    return node.declaration ? isFunction(node.declaration) : false;
  if (['FunctionDeclaration', 'TSDeclareFunction', 'MethodDefinition'].includes(node.type))
    return true;
  if (node.type === 'VariableDeclaration')
    return node.declarations.some(
      (item) =>
        item.init && ['ArrowFunctionExpression', 'FunctionExpression'].includes(item.init.type),
    );
  return (
    ['Property', 'PropertyDefinition'].includes(node.type) &&
    node.value &&
    ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.value.type)
  );
}

const functionSpacing = {
  meta: metadata('blankLine', '함수 앞뒤에는 빈 줄을 한 줄 이상 넣어주세요.', 'whitespace'),
  create(context) {
    const source = context.sourceCode;

    function check(items) {
      for (let index = 1; index < items.length; index += 1) {
        const previous = items[index - 1];
        const next = items[index];
        if (!isFunction(previous) && !isFunction(next)) continue;
        // A comma belongs to the previous object member, so keep it before inserted whitespace.
        const token = source.getTokenAfter(previous);
        const boundary = token?.value === ',' ? token : previous;
        const between = source.text.slice(boundary.range[1], next.range[0]);
        if (/\r?\n[\t ]*\r?\n/.test(between)) continue;
        context.report({
          node: next,
          messageId: 'blankLine',
          fix: (fixer) => fixer.insertTextAfter(boundary, between.includes('\n') ? '\n' : '\n\n'),
        });
      }
    }

    return {
      Program: (node) => check(node.body),
      BlockStatement: (node) => check(node.body),
      SwitchCase: (node) => check(node.consequent),
      ClassBody: (node) => check(node.body),
      ObjectExpression: (node) => check(node.properties),
    };
  },
};

function packageOf(filename) {
  return filename.replaceAll('\\', '/').match(/\/packages\/([^/]+)\//)?.[1];
}

function appOf(filename) {
  return filename.replaceAll('\\', '/').match(/\/apps\/([^/]+)\//)?.[1];
}

function typeOnly(node) {
  return (
    node.type === 'TSImportType' ||
    node.importKind === 'type' ||
    node.exportKind === 'type' ||
    (node.specifiers?.length > 0 &&
      node.specifiers.every((item) => item.importKind === 'type' || item.exportKind === 'type'))
  );
}

const packageBoundaries = {
  meta: metadata('boundary', '이 경로는 패키지 책임을 벗어납니다: {{reason}}'),
  create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    const owner = packageOf(filename);
    const app = appOf(filename);
    const browser = owner === 'web' && /\/src\/(client|format)\//.test(filename);

    function check(node, source) {
      if (typeof source !== 'string') return;
      const targetPath = source.startsWith('.')
        ? path.resolve(path.dirname(context.filename), source).replaceAll('\\', '/')
        : source;
      const target = source.match(/^@manspick\/([^/]+)/)?.[1] ?? packageOf(targetPath);
      const targetApp =
        appOf(targetPath) ??
        ([
          'server',
          'frontend-landing-page',
          'frontend-customer-page',
          'frontend-admin-page',
        ].includes(target)
          ? target
          : undefined);
      let reason;
      if (targetApp && targetApp !== app)
        reason = '다른 앱의 실행부를 가져올 수 없습니다. 공통 타입은 contracts를 사용합니다.';
      else if (
        app &&
        target === 'contracts' &&
        !(source === '@manspick/contracts' && typeOnly(node))
      )
        reason = '앱은 공개 contracts 경로의 타입만 가져올 수 있습니다.';
      else if (owner === 'domain' && target && target !== 'domain')
        reason = 'domain은 다른 맨즈픽 패키지에 의존하지 않습니다.';
      else if (owner === 'design-system' && target && target !== 'design-system')
        reason = '공용 UI는 업무·API 패키지에 의존하지 않습니다.';
      else if (app === 'server' && target && !['domain', 'contracts', 'server'].includes(target))
        reason = 'server의 공용 의존성은 domain과 contracts입니다.';
      else if (
        owner === 'contracts' &&
        (!typeOnly(node) || !['domain', 'contracts'].includes(target))
      )
        reason = 'contracts는 자체 타입과 domain 타입만 참조합니다.';
      else if (owner === 'web' && target && target !== 'web')
        reason = 'web은 업무 패키지와 분리된 앱 연결 도구입니다.';
      else if (
        browser &&
        (source.startsWith('node:') ||
          source === '@opennextjs/cloudflare' ||
          source === 'cloudflare:workers' ||
          /\/proxy(?:\/|$)/.test(targetPath))
      )
        reason = '브라우저 요청·표시 코드에 서버 프록시를 포함할 수 없습니다.';
      else if (
        owner === 'design-system' &&
        /^(next(?:\/|$)|@opennextjs\/|@cloudflare\/|cloudflare:)/.test(source)
      )
        reason = '공용 UI는 Next·Cloudflare 런타임을 가져오지 않습니다.';
      if (reason) context.report({ node, messageId: 'boundary', data: { reason } });
    }

    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => check(node, node.source?.value),
      ExportAllDeclaration: (node) => check(node, node.source.value),
      ImportExpression: (node) => check(node, node.source.value),
      TSImportType: (node) => check(node, node.argument?.value ?? node.argument?.literal?.value),
    };
  },
};

const contractsTypesOnly = {
  meta: metadata('typesOnly', 'contracts에는 타입 선언과 타입 전용 import/export만 작성해주세요.'),
  create(context) {
    return {
      Program(node) {
        for (const statement of node.body) {
          const declaration =
            statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
          const isDeclaration = ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration'].includes(
            declaration?.type,
          );
          const isTypeImportExport =
            ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(
              statement.type,
            ) && typeOnly(statement);
          if (!isDeclaration && !isTypeImportExport)
            context.report({ node: statement, messageId: 'typesOnly' });
        }
      },
    };
  },
};

const packageRules = {
  rules: {
    'export-only-index': exportOnlyIndex,
    'file-description': fileDescription,
    'function-spacing': functionSpacing,
    'package-boundaries': packageBoundaries,
    'contracts-types-only': contractsTypesOnly,
  },
};

export default packageRules;
