
// DFA - Failed Connection Detection

// Initial State
const INITIAL_STATE = "S0";

// DFA State Transition Function
const getNextState = (currentState, eventStatus) => {

    // Successful connection resets the DFA
    if (eventStatus === "SUCCESS") {
        return "S0";
    }

    // Other events do not change the state
    if (eventStatus === "OTHER") {
        return currentState;
    }

    // Failed connection transitions
    const transitions = {
        S0: "S1",
        S1: "S2",
        S2: "S3",
        S3: "S4",
        S4: "S5",
        S5: "S5"
    };

    if (eventStatus === "FAILED") {
        return transitions[currentState] || "S0";
    }

    return currentState;
};

// Check whether security alert should be generated
const isSecurityAlert = (currentState) => {
    return currentState === "S5";
};

module.exports = {
    INITIAL_STATE,
    getNextState,
    isSecurityAlert
};
