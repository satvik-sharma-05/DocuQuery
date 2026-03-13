'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
    content: string
    children: ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
    disabled?: boolean
}

export default function Tooltip({
    content,
    children,
    position = 'top',
    delay = 500,
    disabled = false
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [coords, setCoords] = useState({ x: 0, y: 0 })
    const timeoutRef = useRef<NodeJS.Timeout>()
    const triggerRef = useRef<HTMLDivElement>(null)

    const showTooltip = () => {
        if (disabled) return

        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect()
                const scrollX = window.pageXOffset
                const scrollY = window.pageYOffset

                let x = 0
                let y = 0

                switch (position) {
                    case 'top':
                        x = rect.left + scrollX + rect.width / 2
                        y = rect.top + scrollY - 8
                        break
                    case 'bottom':
                        x = rect.left + scrollX + rect.width / 2
                        y = rect.bottom + scrollY + 8
                        break
                    case 'left':
                        x = rect.left + scrollX - 8
                        y = rect.top + scrollY + rect.height / 2
                        break
                    case 'right':
                        x = rect.right + scrollX + 8
                        y = rect.top + scrollY + rect.height / 2
                        break
                }

                setCoords({ x, y })
                setIsVisible(true)
            }
        }, delay)
    }

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const getTooltipPosition = () => {
        switch (position) {
            case 'top':
                return {
                    left: coords.x,
                    top: coords.y,
                    transform: 'translate(-50%, -100%)',
                }
            case 'bottom':
                return {
                    left: coords.x,
                    top: coords.y,
                    transform: 'translate(-50%, 0)',
                }
            case 'left':
                return {
                    left: coords.x,
                    top: coords.y,
                    transform: 'translate(-100%, -50%)',
                }
            case 'right':
                return {
                    left: coords.x,
                    top: coords.y,
                    transform: 'translate(0, -50%)',
                }
        }
    }

    const getArrowClasses = () => {
        const baseClasses = 'absolute w-2 h-2 bg-gray-900 transform rotate-45'

        switch (position) {
            case 'top':
                return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2`
            case 'bottom':
                return `${baseClasses} -top-1 left-1/2 -translate-x-1/2`
            case 'left':
                return `${baseClasses} -right-1 top-1/2 -translate-y-1/2`
            case 'right':
                return `${baseClasses} -left-1 top-1/2 -translate-y-1/2`
        }
    }

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                className="inline-block"
            >
                {children}
            </div>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-[9999] pointer-events-none"
                        style={getTooltipPosition()}
                    >
                        <div className="relative bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded shadow-lg max-w-xs">
                            {content}
                            <div className={getArrowClasses()} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}