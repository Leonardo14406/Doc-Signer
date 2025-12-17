/**
 * Step Indicator Component
 * 
 * Visual progress indicator for the workflow steps.
 */

'use client'

import { Check, Upload, Edit3, Pen, Download } from 'lucide-react'
import type { StepDefinition, WorkflowStep } from '@/lib/types'

// =============================================================================
// Types
// =============================================================================

interface StepIndicatorProps {
    steps: readonly StepDefinition[]
    currentStepIndex: number
    isStepCompleted: (step: WorkflowStep) => boolean
}

// =============================================================================
// Icon Mapping
// =============================================================================

const stepIcons: Record<WorkflowStep, React.ComponentType<{ className?: string }>> = {
    upload: Upload,
    edit: Edit3,
    sign: Pen,
    download: Download,
}

// =============================================================================
// Component
// =============================================================================

export function StepIndicator({ steps, currentStepIndex, isStepCompleted }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center gap-2 md:gap-4 max-w-4xl mx-auto overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
            {steps.map((step, index) => {
                const Icon = stepIcons[step.id]
                const isActive = index === currentStepIndex
                const isCompleted = isStepCompleted(step.id)
                const isFuture = !isActive && !isCompleted

                return (
                    <div key={step.id} className="flex items-center min-w-fit">
                        <div className="flex flex-col items-center gap-2">
                            <div
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                        ? 'bg-primary text-primary-foreground scale-110 shadow-xl shadow-primary/20'
                                        : isCompleted
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 md:w-6 md:h-6" />
                                ) : (
                                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                                )}
                            </div>
                            <span
                                className={`text-xs md:text-sm font-medium transition-colors ${isActive
                                        ? 'text-foreground'
                                        : isCompleted
                                            ? 'text-foreground/80'
                                            : 'text-muted-foreground'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`w-8 md:w-16 h-[2px] mx-2 md:mx-4 rounded-full transition-all duration-500 mb-6 ${isCompleted ? 'bg-primary' : 'bg-muted'
                                    }`}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
