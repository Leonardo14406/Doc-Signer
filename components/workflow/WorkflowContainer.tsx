/**
 * Workflow Container Component
 * 
 * Orchestrates the document signing workflow using the useWorkflow hook.
 * Renders the appropriate step component based on current state.
 */

'use client'

import { useWorkflow } from '@/hooks'
import { StepIndicator } from './StepIndicator'
import { UploadStep } from './UploadStep'
import { EditStep } from './EditStep'
import { SignStep } from './SignStep'
import { DownloadStep } from './DownloadStep'

// =============================================================================
// Component
// =============================================================================

export function WorkflowContainer() {
    const workflow = useWorkflow()
    const { state, dispatch, steps, stepIndex, isCompleted } = workflow

    return (
        <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl flex flex-col">
            {/* Step Wizard */}
            <div className="mb-12 mt-8">
                <StepIndicator
                    steps={steps}
                    currentStepIndex={stepIndex}
                    isStepCompleted={isCompleted}
                />
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                {state.step === 'upload' && (
                    <UploadStep
                        error={state.error}
                        progress={state.progress}
                        onUploadComplete={(filename, htmlContent) => {
                            dispatch({
                                type: 'UPLOAD_COMPLETE',
                                payload: { filename, htmlContent },
                            })
                        }}
                        onError={(error) => {
                            dispatch({
                                type: 'UPLOAD_ERROR',
                                payload: { error },
                            })
                        }}
                        onProgress={(progress) => {
                            dispatch({
                                type: 'UPLOAD_PROGRESS',
                                payload: { progress },
                            })
                        }}
                    />
                )}

                {state.step === 'edit' && (
                    <EditStep
                        filename={state.filename}
                        initialHtml={state.htmlContent}
                        onContentChange={(htmlContent) => {
                            dispatch({
                                type: 'UPDATE_CONTENT',
                                payload: { htmlContent },
                            })
                        }}
                        onContinue={(pdfBytes) => {
                            dispatch({
                                type: 'EDIT_COMPLETE',
                                payload: { pdfBytes },
                            })
                        }}
                        onCancel={() => {
                            dispatch({ type: 'RESET' })
                        }}
                    />
                )}

                {state.step === 'sign' && (
                    <SignStep
                        filename={state.filename}
                        pdfBytes={state.pdfBytes}
                        onSignatureChange={(hasSignature) => {
                            dispatch({
                                type: 'SIGNATURE_UPDATE',
                                payload: { hasSignature },
                            })
                        }}
                        onComplete={(signedPdfBytes) => {
                            dispatch({
                                type: 'SIGN_COMPLETE',
                                payload: { signedPdfBytes },
                            })
                        }}
                    />
                )}

                {state.step === 'download' && (
                    <DownloadStep
                        filename={state.filename}
                        signedPdfBytes={state.signedPdfBytes}
                        onStartOver={() => {
                            dispatch({ type: 'RESET' })
                        }}
                    />
                )}
            </div>
        </div>
    )
}
