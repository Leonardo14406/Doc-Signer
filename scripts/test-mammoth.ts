
import * as mammoth from 'mammoth'

async function test() {
    console.log('Mammoth test...')
    console.log('convertToHtml:', typeof mammoth.convertToHtml)
    console.log('images:', typeof mammoth.images)
    if (mammoth.images) {
        console.log('images.inline:', typeof (mammoth.images as any).inline)
    }
}

test().catch(console.error)
