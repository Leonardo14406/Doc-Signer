/**
 * Workflow State Machine Hook
 * 
 * Central state management for the document signing workflow.
 * Uses a reducer pattern for predictable state transitions.
 */

'use client'

import { useReducer, useCallback, useMemo } from 'react'
import type {
    WorkflowState,
    WorkflowAction,
    UploadStepState,
    EditStepState,
    SignStepState,
    DownloadStepState,
} from '@/lib/types'
import { getInitialState, getStepIndex, isStepCompleted, WORKFLOW_STEPS } from '@/lib/types/workflow'

// =============================================================================
// Reducer
// =============================================================================

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
    switch (action.type) {
        case 'UPLOAD_PROGRESS': {
            if (state.step !== 'upload') return state
            return {
                ...state,
                progress: action.payload.progress,
            }
        }

        case 'UPLOAD_ERROR': {
            if (state.step !== 'upload') return state
            return {
                ...state,
                error: action.payload.error,
                progress: 0,
            }
        }

        case 'UPLOAD_COMPLETE': {
            const newState: EditStepState = {
                step: 'edit',
                filename: action.payload.filename,
                htmlContent: action.payload.htmlContent,
                isDirty: false,
            }
            return newState
        }

        case 'UPDATE_CONTENT': {
            if (state.step !== 'edit') return state
            return {
                ...state,
                htmlContent: action.payload.htmlContent,
                isDirty: true,
            }
        }

        case 'EDIT_COMPLETE': {
            if (state.step !== 'edit') return state
            const newState: SignStepState = {
                step: 'sign',
                filename: state.filename,
                pdfId: action.payload.pdfId,
                hasSignature: false,
            }
            return newState
        }

        case 'SIGNATURE_UPDATE': {
            if (state.step !== 'sign') return state
            return {
                ...state,
                hasSignature: action.payload.hasSignature,
            }
        }

        case 'SIGN_COMPLETE': {
            if (state.step !== 'sign') return state
            const newState: DownloadStepState = {
                step: 'download',
                filename: state.filename,
                signedPdfId: action.payload.signedPdfId,
            }
            return newState
        }

        case 'GO_BACK': {
            // Navigate to previous step with preserved data where possible
            switch (state.step) {
                case 'edit':
                    return getInitialState()
                case 'sign':
                    // Would need to preserve HTML content - for now, reset
                    return getInitialState()
                case 'download':
                    // Would need to preserve PDF ID - for now, reset
                    return getInitialState()
                default:
                    return state
            }
        }

        case 'RESET': {
            return getInitialState()
        }

        default:
            return state
    }
}

// =============================================================================
// Hook
// =============================================================================

export interface UseWorkflowReturn {
    /** Current workflow state */
    state: WorkflowState
    /** Dispatch an action to update state */
    dispatch: (action: WorkflowAction) => void
    /** Current step ID */
    currentStep: WorkflowState['step']
    /** Index of current step (0-3) */
    stepIndex: number
    /** Whether the current step is complete and can proceed */
    canProceed: boolean
    /** Check if a specific step is completed */
    isCompleted: (step: WorkflowState['step']) => boolean
    /** Reset workflow to initial state */
    reset: () => void
    /** Step definitions for UI rendering */
    steps: typeof WORKFLOW_STEPS
}

/**
 * Hook for managing workflow state
 */
export function useWorkflow(): UseWorkflowReturn {
    const [state, dispatch] = useReducer(workflowReducer, undefined, getInitialState)

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' })
    }, [])

    const isCompleted = useCallback(
        (step: WorkflowState['step']) => isStepCompleted(state.step, step),
        [state.step]
    )

    const canProceed = useMemo(() => {
        switch (state.step) {
            case 'upload':
                return false // Upload step proceeds via UPLOAD_COMPLETE action
            case 'edit':
                return true // Can always proceed from edit
            case 'sign':
                return state.hasSignature
            case 'download':
                return false // Final step
            default:
                return false
        }
    }, [state])

    return {
        state,
        dispatch,
        currentStep: state.step,
        stepIndex: getStepIndex(state.step),
        canProceed,
        isCompleted,
        reset,
        steps: WORKFLOW_STEPS,
    }
}
