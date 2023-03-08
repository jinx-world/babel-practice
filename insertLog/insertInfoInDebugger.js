const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');
const generate = require('@babel/generator').default;
const template = require('@babel/template').default;
const targetIdentifier = ['log', 'error', 'info', 'debug']

const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;
const targetCalleeName = targetIdentifier.map(item => `console.${item}`);

const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: ['jsx']
});

traverse(ast, {
    CallExpression(path, state) {
        const { node } = path
        if (node.isNew) return;
        const calleeName = generate(node.callee).code

        if (targetCalleeName.includes(calleeName)) {
            const { line, column } = node.loc.start
            const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)();
            newNode.isNew = true;

            if (path.findParent(path => path.isJSXElement())) {
                path.replaceWith(types.arrayExpression([newNode, path.node]))
                path.skip();
            } else {
                path.insertBefore(newNode);
            }
        }

    }
});

const { code, map } = generate(ast);
console.log(code);