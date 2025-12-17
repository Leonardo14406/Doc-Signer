"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"

interface DocumentScalerProps {
    children: React.ReactNode
    /**
     * The reference width (e.g., A4 width in px at 96dpi is 794px).
     * Default is 794 (A4 width in pixels).
     */
    targetWidth?: number
    className?: string
    /**
     * Callback when scale changes, useful for coordinate mapping.
     */
    onScaleChange?: (scale: number) => void
}

/**
 * DocumentScaler Component
 * 
 * Proportionally scales document content to fit the parent container's width.
 * Uses transform: scale() to avoid text reflowing, preserving the exact layout.
 */
export default function DocumentScaler({
    children,
    targetWidth = 794,
    className = "",
    onScaleChange,
}: DocumentScalerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    const [containerHeight, setContainerHeight] = useState<number | string>("auto")

    const updateScale = useCallback(() => {
        if (!containerRef.current) return

        const containerWidth = containerRef.current.offsetWidth
        if (containerWidth === 0) return

        const newScale = Math.min(1, containerWidth / targetWidth)
        setScale(newScale)

        // Since scaled content doesn't affect document flow height, 
        // we need to manually set the container height to match the scaled content.
        // Content is assumed to be wrapped in a div that determines its true height.
        const contentElement = containerRef.current.firstElementChild as HTMLElement
        if (contentElement) {
            setContainerHeight(contentElement.offsetHeight * newScale)
        }

        onScaleChange?.(newScale)
    }, [targetWidth, onScaleChange])

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            updateScale()
        })

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        // Initial scale check
        updateScale()

        return () => observer.disconnect()
    }, [updateScale])

    return (
        <div
            ref={containerRef}
            className={`w-full overflow-hidden flex flex-col items-center ${className}`}
            style={{ height: containerHeight }}
        >
            <div
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top center",
                    width: targetWidth,
                    flexShrink: 0,
                }}
            >
                {children}
            </div>
        </div>
    )
}
