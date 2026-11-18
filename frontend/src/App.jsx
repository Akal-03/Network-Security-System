
import React, { useState, useEffect, useCallback } from 'react'
import './App.css'

// Backend API URL
const BACKEND_URL = 'https://network-security-system-2-5172.onrender.com'
const API = `${BACKEND_URL}/api`

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [logs, setLogs] = useState([])
  const [alerts, setAlerts] = useState([])
  const [events, setEvents] = useState([])

  const [dashboard, setDashboard] = useState({
    totalLogs: 0,
    totalAlerts: 0,
    failedConnections: 0,
    criticalAlerts: 0
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigation = [
    { name: 'Dashboard', icon: '▦' },
    { name: 'Network Logs', icon: '▤' },
    { name: 'Security Alerts', icon: '⚠' },
    { name: 'Event History', icon: '◷' },
    { name: 'Automata Analysis', icon: '⇄' }
  ]

  const handleNavigation = (page) => {
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // BACKEND CONNECTION
  const fetchData = useCallback(async () => {
    try {
      setError('')

      const fetchEndpoint = async (endpoint) => {
        const response = await fetch(`${API}/${endpoint}`, {
          headers: { Accept: 'application/json' }
        })

        if (!response.ok) {
          throw new Error(`${endpoint} API returned ${response.status}`)
        }

        return response.json()
      }

      const [
        logsResult,
        alertsResult,
        dashboardResult,
        eventsResult
      ] = await Promise.allSettled([
        fetchEndpoint('logs'),
        fetchEndpoint('alerts'),
        fetchEndpoint('dashboard'),
        fetchEndpoint('events')
      ])

      if (logsResult.status === 'rejected') {
        throw logsResult.reason
      }

      const getArray = (result) => {
        if (result.status !== 'fulfilled') return []

        const value = result.value

        if (Array.isArray(value)) return value
        if (Array.isArray(value?.data)) return value.data
        if (Array.isArray(value?.data?.data)) return value.data.data

        return []
      }

      const nextLogs = getArray(logsResult)
      const nextAlerts = getArray(alertsResult)
      const nextEvents = getArray(eventsResult)

      setLogs(nextLogs)
      setAlerts(nextAlerts)
      setEvents(nextEvents)

      let dashboardInfo = {}

      if (dashboardResult.status === 'fulfilled') {
        const value = dashboardResult.value

        dashboardInfo =
          value?.data && !Array.isArray(value.data)
            ? value.data
            : value || {}
      } else {
        console.warn('Dashboard API unavailable:', dashboardResult.reason)
      }

      const failedCount = nextLogs.filter(
        log => String(log.status || '').toUpperCase() === 'FAILED'
      ).length

      const criticalCount = nextAlerts.filter(
        alert => String(alert.severity || '').toLowerCase() === 'critical'
      ).length

      setDashboard({
        ...dashboardInfo,
        totalLogs: dashboardInfo.totalLogs ?? nextLogs.length,
        totalAlerts: dashboardInfo.totalAlerts ?? nextAlerts.length,
        failedConnections: dashboardInfo.failedConnections ?? failedCount,
        criticalAlerts: dashboardInfo.criticalAlerts ?? criticalCount
      })

      if (alertsResult.status === 'rejected') {
        console.warn('Alerts API unavailable:', alertsResult.reason)
      }

      if (eventsResult.status === 'rejected') {
        console.warn('Events API unavailable:', eventsResult.reason)
      }

    } catch (err) {
      console.error('Backend Error:', err)

      setError(
        `Unable to load network logs from ${BACKEND_URL}. ${
          err.message || 'Check backend URL and server status.'
        }`
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // AUTO REFRESH
  useEffect(() => {
    fetchData()

    const timer = setInterval(fetchData, 10000)

    return () => clearInterval(timer)
  }, [fetchData])

  // HELPERS
  const uniqueIPs = new Set(
    logs.map(log => log.sourceIP).filter(Boolean)
  ).size

  const formatTime = (date) => {
    if (!date) return 'N/A'

    const formatted = new Date(date)

    if (Number.isNaN(formatted.getTime())) return 'N/A'

    return formatted.toLocaleString()
  }

  const getEventName = (log) => {
    if (Number(log.destinationPort) === 23) {
      return 'Restricted Port Access'
    }

    if (log.status === 'FAILED') {
      return 'Connection Failed'
    }

    return 'Network Connection'
  }

  const getLatestDFAState = () => {
    const dfaEvent = events.find(event =>
      event.description?.includes('DFA State:')
    )

    if (!dfaEvent) return 'S0'

    return (
      dfaEvent.description.match(/DFA State:\s*(\w+)/)?.[1] || 'S0'
    )
  }

  // DASHBOARD STATISTICS
  const renderStats = () => (
    <section className="stats">
      <div className="stat-card">
        <p>Total Network Logs</p>
        <h2>{dashboard.totalLogs ?? logs.length}</h2>
        <span>Processed events</span>
      </div>

      <div className="stat-card">
        <p>Suspicious Activities</p>
        <h2>{dashboard.failedConnections ?? 0}</h2>
        <span>Failed connections</span>
      </div>

      <div className="stat-card">
        <p>Security Alerts</p>
        <h2>{dashboard.totalAlerts ?? alerts.length}</h2>
        <span>Detected alerts</span>
      </div>

      <div className="stat-card">
        <p>Active IP Addresses</p>
        <h2>{uniqueIPs}</h2>
        <span>Unique source IPs</span>
      </div>
    </section>
  )

  // NETWORK LOGS
  const renderLogs = () => (
    <section className="panel">
      <h2>Network Traffic Logs</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Source Port</th>
              <th>Destination Port</th>
              <th>Event Type</th>
              <th>Protocol</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr key={log._id || index}>
                  <td>{log.sourceIP || 'N/A'}</td>
                  <td>{log.destinationIP || 'N/A'}</td>
                  <td>{log.sourcePort || 'N/A'}</td>
                  <td>{log.destinationPort || 'N/A'}</td>
                  <td>{getEventName(log)}</td>
                  <td>{log.protocol || 'N/A'}</td>
                  <td>
                    <span className={`status ${(log.status || '').toLowerCase()}`}>
                      {log.status || 'N/A'}
                    </span>
                  </td>
                  <td>{formatTime(log.timestamp || log.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">No network logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )

  // SECURITY ALERTS
  const renderAlerts = () => (
    <section className="panel">
      <h2>Security Alerts Monitoring</h2>

      {alerts.length > 0 ? (
        alerts.map((alert, index) => (
          <div className="alert" key={alert._id || index}>
            <span>⚠</span>

            <div>
              <strong>{alert.alertType || 'Security Alert'}</strong>
              <p>{alert.description || 'No description'}</p>
              <p>Source IP: {alert.sourceIP || 'N/A'}</p>
              <p>Status: {alert.status || 'N/A'}</p>
            </div>

            <span className={`severity ${(alert.severity || '').toLowerCase()}`}>
              {alert.severity || 'N/A'}
            </span>
          </div>
        ))
      ) : (
        <p>No security alerts detected.</p>
      )}
    </section>
  )

  // EVENT HISTORY
  const renderEvents = () => (
    <section className="panel">
      <h2>System Event History</h2>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Source IP</th>
              <th>Event Type</th>
              <th>Description</th>
              <th>Result</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {events.length > 0 ? (
              events.map((event, index) => (
                <tr key={event._id || index}>
                  <td>{event.sourceIP || 'N/A'}</td>
                  <td>{event.eventType || 'N/A'}</td>
                  <td>{event.description || 'N/A'}</td>
                  <td>{event.result || 'N/A'}</td>
                  <td>{formatTime(event.timestamp || event.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No events found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )

  // DFA AUTOMATA ANALYSIS
  const renderAutomata = () => {
    const currentState = getLatestDFAState()

    // Transition table data
    const transitionData = [
      { state: 'S0', input: 'Success', next: 'S0', action: 'Reset Counter', status: 'Normal' },
      { state: 'S0', input: 'Failed', next: 'S1', action: '1st Failure', status: 'Normal' },
      { state: 'S1', input: 'Failed', next: 'S2', action: '2nd Failure', status: 'Normal' },
      { state: 'S2', input: 'Failed', next: 'S3', action: '3rd Failure', status: 'Warning' },
      { state: 'S3', input: 'Failed', next: 'S4', action: '4th Failure', status: 'Warning' },
      { state: 'S4', input: 'Failed', next: 'S5', action: '5th Failure', status: 'Critical Alert' },
      { state: 'S1-S4', input: 'Success', next: 'S0', action: 'Reset State', status: 'Normal' },
      { state: 'S5', input: 'Any', next: 'S5', action: 'Alert Triggered', status: 'Critical' }
    ]

    return (
      <>
        <section className="stats">
          <div className="stat-card">
            <p>Current DFA State</p>
            <h2>{currentState}</h2>
            <span>Latest recorded state</span>
          </div>

          <div className="stat-card">
            <p>Total Processed Logs</p>
            <h2>{logs.length}</h2>
            <span>Network events</span>
          </div>

          <div className="stat-card">
            <p>Failed Connections</p>
            <h2>{dashboard.failedConnections ?? 0}</h2>
            <span>Detected failures</span>
          </div>

          <div className="stat-card">
            <p>Security Alerts</p>
            <h2>{alerts.length}</h2>
            <span>Generated alerts</span>
          </div>
        </section>

        {/* DFA DIAGRAM */}
        <section className="panel dfa-panel">
          <h2>Deterministic Finite Automaton (DFA)</h2>

          <p className="dfa-description">
            The DFA monitors consecutive failed network connections
            and identifies suspicious activities.
          </p>

          <div className="dfa-flow">
            {['S0', 'S1', 'S2', 'S3', 'S4', 'S5'].map((state, index) => {
              const isActive = currentState === state
              const isAlert = state === 'S5'

              return (
                <React.Fragment key={state}>
                  <div
                    className={`dfa-state ${
                      isAlert ? 'alert-state' : ''
                    } ${isActive ? 'active-state' : ''}`}
                  >
                    <div className="state-circle">{state}</div>

                    <span className="state-label">
                      {index === 0
                        ? 'Initial'
                        : index === 5
                          ? 'Alert'
                          : `${index} Failure${index > 1 ? 's' : ''}`}
                    </span>

                    {isActive && (
                      <span className="current-label">CURRENT</span>
                    )}
                  </div>

                  {index < 5 && (
                    <div className="dfa-arrow">
                      <span>Failed</span>
                      <strong>→</strong>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>

          <div className="dfa-info">
            <div>
              <span className="legend blue"></span>
              Normal State
            </div>

            <div>
              <span className="legend green"></span>
              Current State
            </div>

            <div>
              <span className="legend red"></span>
              Alert State
            </div>
          </div>

          {/* NEW DFA TRANSITION TABLE */}
          <div className="dfa-table-section">
            <h2>Finite Automata Transition Table</h2>

            <div className="table-wrapper">
              <table className="dfa-table">
                <thead>
                  <tr>
                    <th>Current State</th>
                    <th>Input</th>
                    <th>Next State</th>
                    <th>Action</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {transitionData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.state}</td>
                      <td>{row.input}</td>
                      <td>{row.next}</td>
                      <td>{row.action}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CURRENT DFA STATUS */}
          <div className="dfa-message">
            <h3>Current DFA Status</h3>

            <p>
              Latest recorded state:
              <strong> {currentState}</strong>
            </p>

            <p className="dfa-warning">
              Five consecutive failed connections trigger a
              high-severity security alert.
            </p>
          </div>
        </section>

        {/* RECENT DFA EVENTS */}
        <section className="panel">
          <h2>Recent DFA Events</h2>

          {events.filter(event =>
            event.description?.includes('DFA State:')
          ).slice(0, 10).map((event, index) => (
            <div className="alert" key={event._id || index}>
              <div>
                <strong>{event.sourceIP || 'Unknown IP'}</strong>
                <p>{event.description}</p>
              </div>
            </div>
          ))}
        </section>
      </>
    )
  }

  // PAGE SELECTION
  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return (
          <>
            {renderStats()}
            {renderLogs()}
            {renderAlerts()}
          </>
        )

      case 'Network Logs':
        return renderLogs()

      case 'Security Alerts':
        return renderAlerts()

      case 'Event History':
        return renderEvents()

      case 'Automata Analysis':
        return renderAutomata()

      default:
        return null
    }
  }

  // MAIN UI
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🛡️ NetSecure</h2>

        <p className="menu-title">MAIN MENU</p>

        {navigation.map(item => (
          <button
            key={item.name}
            type="button"
            className={`menu ${activePage === item.name ? 'active' : ''}`}
            aria-current={activePage === item.name ? 'page' : undefined}
            onClick={() => handleNavigation(item.name)}
          >
            {item.icon} {item.name}
          </button>
        ))}
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>
            <p>Network Log Analysis and Event Correlation</p>
          </div>

          <span className="online">● System Online</span>
        </header>

        {loading ? (
          <section className="panel">
            <h2>Loading data...</h2>
          </section>
        ) : error ? (
          <section className="panel">
            <p style={{ color: '#ff7777' }}>{error}</p>

            <button type="button" onClick={fetchData}>
              Retry Connection
            </button>
          </section>
        ) : (
          renderPage()
        )}

        <footer>
          Network Security Monitoring System | React Dashboard
        </footer>
      </main>
    </div>
  )
}

export default App
