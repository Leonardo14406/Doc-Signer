/**
 * Workflow state machine types
 * 
 * Defines the state machine for the document signing workflow.
 * Uses discriminated unions for type-safe state handling.
 */

// =============================================================================
// Workflow Steps
// =============================================================================

/**
 * All possible workflow steps
 */
export type WorkflowStep = 'upload' | 'edit' | 'sign' | 'download'

/**
 * Step metadata for UI rendering
 */
export interface StepDefinition {
    id: WorkflowStep
    label: string
    description: string
}

/**
 * Ordered list of workflow steps
 */
export const WORKFLOW_STEPS: readonly StepDefinition[] = [
    { id: 'upload', label: 'Upload', description: 'Upload your Word document' },
    { id: 'edit', label: 'Edit', description: 'Review and edit content' },
    { id: 'sign', label: 'Sign', description: 'Add your signature' },
    { id: 'download', label: 'Download', description: 'Download signed PDF' },
] as const

// =============================================================================
// Step-specific State Types
// =============================================================================

/**
 * State when in upload step
 */
export interface UploadStepState {
    step: 'upload'
    /** Error message if upload failed */
    error: string | null
    /** Upload progress (0-100) */
    progress: number
}

/**
 * State when in edit step
 */
export interface EditStepState {
    step: 'edit'
    /** Original filename */
    filename: string
    /** Current HTML content being edited */
    htmlContent: string
    /** Whether content has been modified */
    isDirty: boolean
}

/**
 * State when in sign step
 */
export interface SignStepState {
    step: 'sign'
    /** Original filename */
    filename: string
    /** Generated PDF ID */
    pdfId: string
    /** Whether a signature has been drawn */
    hasSignature: boolean
}

/**
 * State when in download step
 */
export interface DownloadStepState {
    step: 'download'
    /** Original filename */
    filename: string
    /** Final signed PDF ID */
    signedPdfId: string
}

/**
 * Discriminated union of all possible workflow states
 */
export type WorkflowState =
    | UploadStepState
    | EditStepState
    | SignStepState
    | DownloadStepState

// =============================================================================
// Workflow Actions
// =============================================================================

/**
 * Action to complete file upload
 */
export interface UploadCompleteAction {
    type: 'UPLOAD_COMPLETE'
    payload: {
        filename: string
        htmlContent: string
    }
}

/**
 * Action to report upload error
 */
export interface UploadErrorAction {
    type: 'UPLOAD_ERROR'
    payload: {
        error: string
    }
}

/**
 * Action to update upload progress
 */
export interface UploadProgressAction {
    type: 'UPLOAD_PROGRESS'
    payload: {
        progress: number
    }
}

/**
 * Action to update HTML content in editor
 */
export interface UpdateContentAction {
    type: 'UPDATE_CONTENT'
    payload: {
        htmlContent: string
    }
}

/**
 * Action to complete editing and generate PDF
 */
export interface EditCompleteAction {
    type: 'EDIT_COMPLETE'
    payload: {
        pdfId: string
    }
}

/**
 * Action to update signature status
 */
export interface SignatureUpdateAction {
    type: 'SIGNATURE_UPDATE'
    payload: {
        hasSignature: boolean
    }
}

/**
 * Action to complete signing
 */
export interface SignCompleteAction {
    type: 'SIGN_COMPLETE'
    payload: {
        signedPdfId: string
    }
}

/**
 * Action to reset workflow to initial state
 */
export interface ResetAction {
    type: 'RESET'
}

/**
 * Action to go back to previous step
 */
export interface GoBackAction {
    type: 'GO_BACK'
}

/**
 * Union of all possible workflow actions
 */
export type WorkflowAction =
    | UploadCompleteAction
    | UploadErrorAction
    | UploadProgressAction
    | UpdateContentAction
    | EditCompleteAction
    | SignatureUpdateAction
    | SignCompleteAction
    | ResetAction
    | GoBackAction

// =============================================================================
// Workflow Utilities
// =============================================================================

/**
 * Get the index of a step in the workflow
 */
export function getStepIndex(step: WorkflowStep): number {
    return WORKFLOW_STEPS.findIndex(s => s.id === step)
}

/**
 * Check if a step is completed relative to current step
 */
export function isStepCompleted(currentStep: WorkflowStep, checkStep: WorkflowStep): boolean {
    return getStepIndex(currentStep) > getStepIndex(checkStep)
}

/**
 * Get the initial workflow state
 */
export function getInitialState(): UploadStepState {
    return {
        step: 'upload',
        error: null,
        progress: 0,
    }
}
