
import React, { useState, useEffect, useCallback } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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

  // NAVIGATION MENU

  const navigation = [
    { name: 'Dashboard', icon: '▦' },
    { name: 'Network Logs', icon: '▤' },
    { name: 'Security Alerts', icon: '⚠' },
    { name: 'Event History', icon: '◷' },
    { name: 'Automata Analysis', icon: '⇄' }
  ]

  // PAGE NAVIGATION

  const handleNavigation = (page) => {
    setActivePage(page)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // FETCH BACKEND DATA

  const fetchData = useCallback(async () => {
    try {
      const responses = await Promise.all([
        fetch(`${API}/logs`),
        fetch(`${API}/alerts`),
        fetch(`${API}/dashboard`),
        fetch(`${API}/events`)
      ])

      if (responses.some(response => !response.ok)) {
        throw new Error('API request failed')
      }

      const [logsData, alertsData, dashboardData, eventsData] =
        await Promise.all(
          responses.map(response => response.json())
        )

      setLogs(Array.isArray(logsData.data) ? logsData.data : [])
      setAlerts(Array.isArray(alertsData.data) ? alertsData.data : [])
      setDashboard(dashboardData.data || {})
      setEvents(Array.isArray(eventsData.data) ? eventsData.data : [])

      setError('')

    } catch (err) {
      console.error('Backend Error:', err)
      setError('Backend connection failed. Check port 5000.')
    } finally {
      setLoading(false)
    }
  }, [])

  // AUTOMATIC DATA REFRESH

  useEffect(() => {
    fetchData()

    const timer = setInterval(() => {
      fetchData()
    }, 10000)

    return () => clearInterval(timer)
  }, [fetchData])

  // HELPER FUNCTIONS

  const uniqueIPs = new Set(
    logs.map(log => log.sourceIP).filter(Boolean)
  ).size

  const formatTime = (date) => {
    if (!date) return 'N/A'

    const formatted = new Date(date)

    if (Number.isNaN(formatted.getTime())) {
      return 'N/A'
    }

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

  // GET LATEST DFA STATE

  const getLatestDFAState = () => {
    const dfaEvent = events.find(event =>
      event.description?.includes('DFA State:')
    )

    if (!dfaEvent) return 'S0'

    return (
      dfaEvent.description.match(/DFA State:\s*(\w+)/)?.[1]
      || 'S0'
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
        <h2>{alerts.length}</h2>
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
              logs.map(log => (
                <tr key={log._id}>
                  <td>{log.sourceIP}</td>
                  <td>{log.destinationIP}</td>
                  <td>{log.sourcePort}</td>
                  <td>{log.destinationPort}</td>
                  <td>{getEventName(log)}</td>
                  <td>{log.protocol}</td>

                  <td>
                    <span className={`status ${(log.status || '').toLowerCase()}`}>
                      {log.status}
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
        alerts.map(alert => (
          <div className="alert" key={alert._id}>

            <span>⚠</span>

            <div>
              <strong>{alert.alertType}</strong>

              <p>{alert.description}</p>
              <p>Source IP: {alert.sourceIP}</p>
              <p>Status: {alert.status}</p>
            </div>

            <span className={`severity ${(alert.severity || '').toLowerCase()}`}>
              {alert.severity}
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
              events.map(event => (
                <tr key={event._id}>
                  <td>{event.sourceIP}</td>
                  <td>{event.eventType}</td>
                  <td>{event.description}</td>
                  <td>{event.result}</td>
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
                    className={`dfa-state ${isAlert ? 'alert-state' : ''} ${isActive ? 'active-state' : ''}`}
                  >

                    <div className="state-circle">
                      {state}
                    </div>

                    <span className="state-label">
                      {index === 0
                        ? 'Initial'
                        : index === 5
                        ? 'Alert'
                        : `${index} Failure${index > 1 ? 's' : ''}`}
                    </span>

                    {isActive && (
                      <span className="current-label">
                        CURRENT
                      </span>
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

        <section className="panel">

          <h2>Recent DFA Events</h2>

          {events.filter(event =>
            event.description?.includes('DFA State:')
          ).slice(0, 10).map(event => (

            <div className="alert" key={event._id}>

              <div>
                <strong>{event.sourceIP}</strong>
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

      {/* SIDEBAR */}

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

      {/* MAIN CONTENT */}

      <main className="main-content">

        <header className="topbar">

          <div>
            <h1>{activePage}</h1>
            <p>Network Log Analysis and Event Correlation</p>
          </div>

          <span className="online">
            ● System Online
          </span>

        </header>

        {/* LOADING / ERROR / CONTENT */}

        {loading ? (

          <section className="panel">
            <h2>Loading data...</h2>
          </section>

        ) : error ? (

          <section className="panel">

            <p style={{ color: '#ff7777' }}>
              {error}
            </p>

            <button type="button" onClick={fetchData}>
              Retry Connection
            </button>

          </section>

        ) : renderPage()}

        {/* FOOTER */}

        <footer>
          Network Security Monitoring System | React Dashboard
        </footer>

      </main>

    </div>
  )
}

export default App
