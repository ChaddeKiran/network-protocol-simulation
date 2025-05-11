// script.js

// DOM references
const protocolTitle = document.getElementById("protocol-title");
const protocolDescription = document.getElementById("protocol-description");
const consoleOutput = document.getElementById("console");
const clearConsoleBtn = document.getElementById("clear-console");
const clientInput = document.getElementById("client-input");
const serverOutput = document.getElementById("server-output");
const smtpMiddleman = document.getElementById("smtp-middleman");
const smtpConnection = document.getElementById("smtp-connection");

// Packet movement elements
const packetContainers = document.querySelectorAll(".packet-container");

// // Sequence number tracking
// let currentSeq = 1000;
// let currentAck = 1000;

// //

// // TCP 3-way handshake definition
// const tcpHandshake = {
//     title: "TCP 3-Way Handshake",
//     steps: [
//         () => `Client sends SYN packet to Server (Seq: ${currentSeq}).`,
//         () => `Server responds with SYN-ACK packet (Seq: ${currentAck}, Ack: ${currentSeq + 1}).`,
//         () => `Client sends ACK packet (Ack: ${currentAck + 1}).`
//     ],
//     color: "#F4D03F",
//     packetEmoji: "⚙️",
//     packetCount: 2,
//     directions: ["forward", "backward", "forward"]
// };

// // TCP connection termination definition
// const tcpTermination = {
//     title: "TCP Connection Termination",
//     steps: [
//         () => `Client sends FIN packet to Server (Seq: ${currentSeq}).`,
//         () => `Server responds with FIN-ACK packet (Seq: ${currentAck}, Ack: ${currentSeq + 1}).`,
//         () => `Client sends ACK packet (Ack: ${currentAck + 1}).`
//     ],
//     color: "#F4D03F",
//     packetEmoji: "⚙️",
//     packetCount: 2,
//     directions: ["forward", "backward", "forward"]
// };


let state = {
    clientSeq: 1000,
    serverSeq: 5000,
    clientAck: 0,
    serverAck: 0
};

const tcpHandshake = {
    title: "TCP 3-Way Handshake",
    steps: [
        () => {
            const msg = `Client sends SYN packet to Server (Seq: ${state.clientSeq}).`;
            state.clientAck = state.serverSeq + 1;  // anticipating server's seq
            return msg;
        },
        () => {
            const msg = `Server responds with SYN-ACK packet (Seq: ${state.serverSeq}, Ack: ${state.clientSeq + 1}).`;
            state.serverAck = state.clientSeq + 1;
            state.serverSeq += 1;  // server increments its own seq
            return msg;
        },
        () => {
            const msg = `Client sends ACK packet (Ack: ${state.serverSeq}).`;
            state.clientSeq += 1;
            return msg;
        }
    ],
    color: "#F4D03F",
    packetEmoji: "⚙️",
    packetCount: 2,
    directions: ["forward", "backward", "forward"]
};

const tcpTermination = {
    title: "TCP Connection Termination",
    steps: [
        () => {
            const msg = `Client sends FIN packet to Server (Seq: ${state.clientSeq}).`;
            state.clientSeq += 1;
            return msg;
        },
        () => {
            const msg = `Server responds with FIN-ACK packet (Seq: ${state.serverSeq}, Ack: ${state.clientSeq}).`;
            state.serverSeq += 1;
            return msg;
        },
        () => {
            const msg = `Client sends ACK packet ( Ack: ${state.serverSeq}).`;
            return msg;
        }
    ]
};


// Protocol definitions
const protocols = {
    "http-btn": {
        title: "HTTP Protocol Simulation",
        description: "Transferring plaintext web data over TCP (Port 80).",
        steps: [
            () => `Client sends HTTP GET request to Server via Router 1 and Router 2 (Seq: ${currentSeq}).`,
            () => `Request travels through network (Ack: ${currentSeq + 1}).`,
            () => `Server processes request (Seq: ${currentAck}).`,
            () => `Server responds with web page data (Ack: ${currentAck + 1}).`
        ],
        color: "#2196F3",
        packetEmoji: "📦",
        packetCount: 3
    },
    "https-btn": {
        title: "HTTPS Protocol Simulation",
        description: "Secure web transfer using TLS over Port 443.",
        steps: [
            () => `Client encrypts data and initiates TLS handshake (Seq: ${currentSeq}).`,
            () => `Encrypted request sent through routers (Ack: ${currentSeq + 1}).`,
            () => `Server decrypts and processes request (Seq: ${currentAck}).`,
            () => `Server sends encrypted response back (Ack: ${currentAck + 1}).`
        ],
        color: "#4CAF50",
        packetEmoji: "🔒",
        packetCount: 3
    },
    "smtp-btn": {
        title: "SMTP Email Simulation",
        description: "Simulating email sending via SMTP protocol through an SMTP server.",
        steps: [
            () => `Client sends email to SMTP server via Router 1 (Seq: ${currentSeq}).`,
            () => `SMTP server processes email (Ack: ${currentSeq + 1}).`,
            () => `Email forwarded to destination server via Router 2 (Seq: ${currentAck}).`,
            () => `Destination server acknowledges receipt (Ack: ${currentAck + 1}).`
        ],
        color: "#FF9800",
        packetEmoji: "📧",
        packetCount: 3,
        senderEmail: "sender@example.com",
        receiverEmail: "receiver@example.com"
    },
    "ftp-btn": {
        title: "FTP File Transfer Simulation",
        description: "Simulating file upload/download using FTP with progress tracking.",
        steps: [
            () => `Client initiates control connection (Port 21) (Seq: ${currentSeq}).`,
            () => `Authentication completed (Ack: ${currentSeq + 1}).`,
            () => `File segments sent via data connection (Port 20) (Seq: ${currentAck}).`,
            () => `Server confirms complete file transfer (Ack: ${currentAck + 1}).`
        ],
        color: "#9C27B0",
        packetEmoji: "📁",
        packetCount: 3
    }
};

// Initialize protocol buttons
Object.keys(protocols).forEach(id => {
    const btn = document.getElementById(id);
    btn.addEventListener("click", () => startSimulation(id));
});

// Clear console
clearConsoleBtn.addEventListener("click", () => {
    consoleOutput.innerHTML = "";
    serverOutput.value = "";
});

// Start protocol simulation
function startSimulation(id) {
    const protocol = protocols[id];
    protocolTitle.textContent = protocol.title;
    protocolDescription.textContent = protocol.description;

    // Reset sequence numbers
    currentSeq = 1000;
    currentAck = 1000;

    // Clear previous states
    serverOutput.value = "";
    smtpMiddleman.classList.add("hidden");
    smtpConnection.classList.add("hidden");
    packetContainers.forEach(c => c.innerHTML = "");

    // Show SMTP middleman for SMTP protocol
    if (id === "smtp-btn") {
        smtpMiddleman.classList.remove("hidden");
        smtpConnection.classList.remove("hidden");
        // Log sender and receiver email for SMTP
        logToConsole(`SMTP Sender: ${protocol.senderEmail}, Receiver: ${protocol.receiverEmail}`, "info");
    }

    logToConsole(`Starting ${protocol.title}`, "info");

    // Handle input and output
    let inputData = clientInput.value || "Sample data";
    let outputData = inputData;

    if (id === "https-btn") {
        inputData = `Encrypted: ${btoa(inputData)}`; // Simulate encryption
        outputData = atob(inputData.split("Encrypted: ")[1]); // Simulate decryption
    }

    // Run TCP handshake, protocol simulation, then TCP termination
    simulateTcpHandshake(() => {
        logToConsole("TCP Connection Established. Starting protocol simulation...", "info");
        simulateProtocol(protocol, inputData, outputData, () => {
            logToConsole("Protocol simulation complete. Closing TCP connection...", "info");
            simulateTcpTermination();
        });
    });
}

// Simulate TCP 3-way handshake
function simulateTcpHandshake(callback) {
    let stepIndex = 0;
    const delay = 1000;

    protocolTitle.textContent = tcpHandshake.title;
    protocolDescription.textContent = "Establishing TCP connection with 3-way handshake.";

    const interval = setInterval(() => {
        if (stepIndex < tcpHandshake.steps.length) {
            for (let i = 0; i < tcpHandshake.packetCount; i++) {
                animatePacket(stepIndex, tcpHandshake.color, tcpHandshake.packetEmoji, tcpHandshake.directions[stepIndex]);
            }
            logToConsole(tcpHandshake.steps[stepIndex](), "success");

            // Update sequence numbers
            if (stepIndex === 0) currentSeq += 1; // After SYN
            if (stepIndex === 1) currentAck += 1; // After SYN-ACK
            if (stepIndex === 2) {
                currentSeq = 2000; // Reset for data transfer
                currentAck = 1001;
            }

            stepIndex++;
        } else {
            clearInterval(interval);
            callback();
        }
    }, delay);
}

// Simulate protocol-specific steps
function simulateProtocol(protocol, inputData, outputData, callback) {
    let stepIndex = 0;
    const delay = 1000;

    protocolTitle.textContent = protocol.title;
    protocolDescription.textContent = protocol.description;

    const interval = setInterval(() => {
        if (stepIndex < protocol.steps.length) {
            for (let i = 0; i < protocol.packetCount; i++) {
                animatePacket(stepIndex, protocol.color, protocol.packetEmoji, "forward");
            }
            logToConsole(protocol.steps[stepIndex](), "success");

            if (stepIndex === 0) {
                clientInput.value = inputData;
            }
            if (stepIndex === protocol.steps.length - 1) {
                serverOutput.value = outputData;
            }

            // Update sequence numbers for data transfer
            if (stepIndex % 2 === 0) {
                currentSeq += 1; // Data packet sent
            } else {
                currentAck += 1; // ACK received
            }

            stepIndex++;
        } else {
            clearInterval(interval);
            callback();
        }
    }, delay);
}

// Simulate TCP connection termination
function simulateTcpTermination() {
    let stepIndex = 0;
    const delay = 1000;

    protocolTitle.textContent = tcpTermination.title;
    protocolDescription.textContent = "Closing TCP connection with FIN handshake.";

    const interval = setInterval(() => {
        if (stepIndex < tcpTermination.steps.length) {
            for (let i = 0; i < tcpTermination.packetCount; i++) {
                animatePacket(stepIndex, tcpTermination.color, tcpTermination.packetEmoji, tcpTermination.directions[stepIndex]);
            }
            logToConsole(tcpTermination.steps[stepIndex](), "success");

            // Update sequence numbers
            if (stepIndex === 0) currentSeq += 1; // After FIN
            if (stepIndex === 1) currentAck += 1; // After FIN-ACK

            stepIndex++;
        } else {
            logToConsole("Simulation complete.", "info");
            clearInterval(interval);
        }
    }, delay);
}

// Animate packet through one segment
function animatePacket(index, color, emoji, direction) {
    if (packetContainers[index]) {
        const packet = document.createElement("div");
        packet.classList.add("packet", direction);
        packet.style.backgroundColor = color;
        packet.textContent = emoji;

        packetContainers[index].appendChild(packet);

        packet.style.transform = direction === "backward" ? "translateX(-100%)" : "translateX(100%)";
        setTimeout(() => packet.remove(), 1500);
    }
}

// Log to console with optional styling
function logToConsole(message, type = "info") {
    const logLine = document.createElement("div");
    logLine.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logLine.classList.add("log-line", `log-${type}`);
    consoleOutput.appendChild(logLine);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}