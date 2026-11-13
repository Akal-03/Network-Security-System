
const {
    INITIAL_STATE,
    getNextState,
    isSecurityAlert
} = require("./failedConnection");

// Store DFA state separately for each IP address
const ipStates = new Map();

// Process each network connection
const processConnection = (sourceIP, status) => {

    // Get previous state of this IP
    const previousState = ipStates.get(sourceIP) || INITIAL_STATE;

    // Calculate next DFA state
    const nextState = getNextState(previousState, status);

    // Save updated state
    ipStates.set(sourceIP, nextState);

    // Generate alert only when entering S5
    const alertTriggered =
        previousState !== "S5" && isSecurityAlert(nextState);

    return {
        sourceIP,
        previousState,
        currentState: nextState,
        alertTriggered
    };
};

module.exports = processConnection;
