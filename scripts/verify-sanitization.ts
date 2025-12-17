
import { sanitizeHtml, validateHtml, normalizeHtml } from '../lib/sanitization'

console.log('Running Sanitization Verification...')

const tests = [
    {
        name: 'Allow valid tags',
        input: '<h1>Title</h1><p>Paragraph</p>',
        expected: '<h1>Title</h1><p>Paragraph</p>'
    },
    {
        name: 'Strip script tags',
        input: '<p>Test</p><script>alert(1)</script>',
        expected: '<p>Test</p>'
    },
    {
        name: 'Strip event handlers',
        input: '<p onclick="alert(1)">Click</p>',
        expected: '<p>Click</p>'
    },
    {
        name: 'Strip style attributes (strict)',
        input: '<p style="color: red">Red</p>',
        expected: '<p>Red</p>'
    },
    {
        name: 'Normalize whitespace',
        input: '<p>  Hello   World  </p>',
        expected: '<p> Hello World </p>'
    }
]

async function runTests() {
    let passed = 0
    let failed = 0

    for (const test of tests) {
        try {
            const result = await sanitizeHtml(test.input)
            if (result === test.expected) {
                console.log(`✅ ${test.name}`)
                passed++
            } else {
                console.log(`❌ ${test.name}`)
                console.log(`   Input:    ${test.input}`)
                console.log(`   Expected: ${test.expected}`)
                console.log(`   Actual:   ${result}`)
                failed++
            }
        } catch (e) {
            console.log(`❌ ${test.name} - Exception: ${e}`)
            failed++
        }
    }

    console.log('\n--- Validation Tests ---')
    const validationTest = await validateHtml('<script>Bad</script>')
    if (validationTest.valid === false && validationTest.violations.length > 0) {
        console.log('✅ Validation correctly identified invalid content')
        passed++
    } else {
        console.log('❌ Validation FAILED to identify invalid content')
        failed++
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`)

    if (failed > 0) process.exit(1)
}

runTests().catch(err => {
    console.error('Final failure:', err)
    process.exit(1)
})
