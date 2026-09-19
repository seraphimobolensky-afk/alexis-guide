'use client'
import { Component, type ReactNode } from 'react'

interface Props {
  fallback: ReactNode
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches render/lifecycle/effect errors thrown by a WebGL component (e.g. a
 * shader failing to compile on an unusual GPU/driver) and swaps in a plain
 * fallback instead of taking down the page. This is the backstop for
 * anything that actually throws — components should still handle a merely
 * *unavailable* WebGL context gracefully on their own (see onStatusChange).
 */
export default class WebglErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('WebGL component failed, falling back to static UI.', error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
