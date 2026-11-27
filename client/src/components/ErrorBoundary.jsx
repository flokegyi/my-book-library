import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Application error:', error)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold text-stone-950">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Reload the page to continue. Your library data is safe.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
