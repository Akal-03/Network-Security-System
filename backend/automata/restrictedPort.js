
const RESTRICTED_PORTS = [23, 135, 139, 445];

const checkRestrictedPort = (destinationPort) => {
    const port = Number(destinationPort);

    if (RESTRICTED_PORTS.includes(port)) {
        return {
            restricted: true,
            port: port,
            severity: "HIGH",
            message: `Restricted port ${port} access detected`
        };
    }

    return {
        restricted: false,
        port: port,
        severity: "LOW",
        message: "Normal port access"
    };
};

module.exports = checkRestrictedPort;
