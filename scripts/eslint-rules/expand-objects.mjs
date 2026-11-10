const complexValues = new Set([
  'ArrayExpression',
  'ArrowFunctionExpression',
  'AwaitExpression',
  'CallExpression',
  'ConditionalExpression',
  'FunctionExpression',
  'LogicalExpression',
  'NewExpression',
  'ObjectExpression',
])

function unwrap(node) {
  let current = node

  while (
    ['ChainExpression', 'TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(
      current.type,
    )
  )
    current = current.expression

  return current
}

function isComplex(property) {
  if (property.type === 'SpreadElement') return false

  const value = unwrap(property.value)

  if (value.type === 'ObjectExpression' || value.type === 'ArrayExpression')
    return value.type === 'ObjectExpression'
      ? value.properties.length > 0
      : value.elements.length > 0

  return complexValues.has(value.type) || property.method
}

export default {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description:
        'Put each property of an object on its own line when it has two or more properties or a non-trivial value',
    },
    messages: { expand: 'Put each property of this object on its own line.' },
    schema: [],
  },
  create(context) {
    const source = context.sourceCode

    return {
      ObjectExpression(node) {
        if (!node.properties.length) return

        const open = source.getFirstToken(node)
        const first = source.getTokenAfter(open)

        if (first.loc.start.line !== open.loc.end.line) return

        if (node.properties.length < 2 && !node.properties.some(isComplex)) return

        context.report({
          node,
          messageId: 'expand',
          fix: (fixer) => fixer.insertTextAfter(open, '\n'),
        })
      },
    }
  },
}
