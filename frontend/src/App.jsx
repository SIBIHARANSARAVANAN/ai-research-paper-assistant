import React, { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'

function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [documentInfo, setDocumentInfo] = useState(null)
  const [question, setQuestion] = useState('')
  const [loadingAnswer, setLoadingAnswer] = useState(false)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null)
    setDocumentInfo(null)
    setAnswer('')
    setHistory([])
    setError('')
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please choose a PDF file first.')
      return
    }
    setError('')
    setUploading(true)
    setAnswer('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/upload_pdf`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Upload failed')
      }
      const data = await res.json()
      setDocumentInfo(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async () => {
    if (!documentInfo?.document_id) {
      setError('Upload a PDF first.')
      return
    }
    if (!question.trim()) {
      setError('Type a question about the paper.')
      return
    }
    setError('')
    setLoadingAnswer(true)

    try{
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentInfo.document_id,
          question: question.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to get answer')
      }
      const data = await res.json()
      setAnswer(data.answer)
      setHistory((prev) => [
        { question: question.trim(), answer: data.answer, ts: Date.now() },
        ...prev,
      ])
      setQuestion('')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error while asking question')
    } finally {
      setLoadingAnswer(false)
    }
  }

  return (
    <div className="app-root">
      <div className="top-bar">
        <div className="logo">
          <span className="logo-mark">AI</span>
          <span className="logo-text">Research Paper Assistant</span>
        </div>
        <div className="top-actions">
          <span className="pill">Upload → Ask → Understand</span>
        </div>
      </div>

      <div className="layout">
        <aside className="sidebar">
          <h2 className="sidebar-title">1. Upload your paper</h2>
          <p className="sidebar-subtitle">
            Drop a <strong>PDF research paper</strong> and I&apos;ll help you summarise and query it.
          </p>

          <label className="upload-card">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden-input"
            />
            <div className="upload-icon">📄</div>
            <div>
              <div className="upload-title">
                {file ? file.name : 'Click to choose a PDF'}
              </div>
              <div className="upload-hint">
                Max ~20–30 pages recommended for best results.
              </div>
            </div>
          </label>

          <button
            className="primary-btn full-width"
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </button>

          {documentInfo && (
            <div className="doc-card">
              <div className="doc-label">Current document</div>
              <div className="doc-name">{documentInfo.filename}</div>
              <div className="doc-meta">
                <span>ID: {documentInfo.document_id.slice(0, 8)}…</span>
                <span>Chars: {documentInfo.char_count}</span>
              </div>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <div className="hint-box">
            <div className="hint-title">Try questions like:</div>
            <ul className="hint-list">
              <li>• What is the main contribution of this paper?</li>
              <li>• Summarise the methodology in simple terms.</li>
              <li>• What are the limitations and future work?</li>
            </ul>
          </div>
        </aside>

        <main className="main-panel">
          <section className="qa-section">
            <h2 className="section-title">2. Ask anything about the paper</h2>
            <div className="question-row">
              <textarea
                className="question-input"
                placeholder="Ask a question about the uploaded research paper…"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button
                className="primary-btn ask-btn"
                onClick={handleAsk}
                disabled={loadingAnswer}
              >
                {loadingAnswer ? 'Thinking…' : 'Ask'}
              </button>
            </div>

            {answer && (
              <div className="answer-card">
                <div className="answer-label">Assistant</div>
                <div className="answer-body">
                  {answer.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="history-section">
            <div className="history-header">
              <h3>Conversation history</h3>
              {history.length > 0 && (
                <button
                  className="ghost-btn"
                  onClick={() => setHistory([])}
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="history-empty">
                Questions and answers will appear here as you interact with the paper.
              </p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div className="history-item" key={item.ts}>
                    <div className="history-question">
                      <span className="chip">You</span>
                      <p>{item.question}</p>
                    </div>
                    <div className="history-answer">
                      <span className="chip secondary">Assistant</span>
                      {item.answer.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default App