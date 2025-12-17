/**
 * Editor Toolbar Component
 * 
 * Formatting controls for the editor.
 * Reactive to editor selection state.
 */

'use client'

import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { useEditorContext } from './EditorProvider'

// =============================================================================
// Component
// =============================================================================

export function EditorToolbar() {
    const { execCommand, isReady, activeFormats } = useEditorContext()

    // Helper to check boolean states safely
    const isActive = (key: string) => !!activeFormats[key]

    // Helper to check value states
    const isValue = (key: string, value: any) => activeFormats[key] === value

    return (
        <div className="flex items-center gap-2 p-2 border-b bg-muted/30 flex-wrap sticky top-0 z-20 backdrop-blur-sm bg-white/80 dark:bg-black/80">
            {/* Text Formatting */}
            <div className="flex items-center gap-1">
                <Toggle
                    size="sm"
                    aria-label="Bold"
                    disabled={!isReady}
                    pressed={isActive('bold')}
                    onPressedChange={() => execCommand({ type: 'bold' })}
                    className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    aria-label="Italic"
                    disabled={!isReady}
                    pressed={isActive('italic')}
                    onPressedChange={() => execCommand({ type: 'italic' })}
                    className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    aria-label="Underline"
                    disabled={!isReady}
                    pressed={isActive('underline')}
                    onPressedChange={() => execCommand({ type: 'underline' })}
                    className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
                >
                    <Underline className="h-4 w-4" />
                </Toggle>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
                <Toggle
                    size="sm"
                    aria-label="Align Left"
                    disabled={!isReady}
                    pressed={isValue('textAlign', 'left')}
                    onPressedChange={() => execCommand({ type: 'alignLeft' })}
                >
                    <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    aria-label="Align Center"
                    disabled={!isReady}
                    pressed={isValue('textAlign', 'center')}
                    onPressedChange={() => execCommand({ type: 'alignCenter' })}
                >
                    <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    aria-label="Align Right"
                    disabled={!isReady}
                    pressed={isValue('textAlign', 'right')}
                    onPressedChange={() => execCommand({ type: 'alignRight' })}
                >
                    <AlignRight className="h-4 w-4" />
                </Toggle>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Headings */}
            <div className="flex items-center gap-1">
                <Button
                    variant={isActive('paragraph') ? 'secondary' : 'ghost'}
                    size="sm"
                    disabled={!isReady}
                    onClick={() => execCommand({ type: 'paragraph' })}
                    title="Normal Text"
                    className={isActive('paragraph') ? 'bg-primary/10 text-primary' : ''}
                >
                    <Type className="h-4 w-4" />
                </Button>
                <Button
                    variant={isValue('heading', 1) ? 'secondary' : 'ghost'}
                    size="sm"
                    disabled={!isReady}
                    onClick={() => execCommand({ type: 'heading', level: 1 })}
                    className={`font-bold text-lg px-2 ${isValue('heading', 1) ? 'bg-primary/10 text-primary' : ''}`}
                    title="Heading 1"
                >
                    H1
                </Button>
                <Button
                    variant={isValue('heading', 2) ? 'secondary' : 'ghost'}
                    size="sm"
                    disabled={!isReady}
                    onClick={() => execCommand({ type: 'heading', level: 2 })}
                    className={`font-bold px-2 ${isValue('heading', 2) ? 'bg-primary/10 text-primary' : ''}`}
                    title="Heading 2"
                >
                    H2
                </Button>
                <Button
                    variant={isValue('heading', 3) ? 'secondary' : 'ghost'}
                    size="sm"
                    disabled={!isReady}
                    onClick={() => execCommand({ type: 'heading', level: 3 })}
                    className={`font-semibold text-sm px-2 ${isValue('heading', 3) ? 'bg-primary/10 text-primary' : ''}`}
                    title="Heading 3"
                >
                    H3
                </Button>
            </div>
        </div>
    )
}
