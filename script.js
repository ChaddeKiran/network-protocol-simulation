$(document).ready(function() {
    // Variables
    let isTcpMode = true;
    let isSimulationRunning = false;
    let dropRate = 30; // %
    let animationSpeed = 3; // 1-5
    let packetSize = 4; // characters per packet
    let speedMultiplier = 1;
    let routePaths = [
        { route: ['client', 'router-1', 'router-2', 'router-4', 'server'], name: 'A→B→D' },
        { route: ['client', 'router-1', 'router-3', 'router-4', 'server'], name: 'A→C→D' }
    ];
    
    // Event listeners
    $('#tcp-btn').click(function() {
        if (!isSimulationRunning && !isTcpMode) {
            isTcpMode = true;
            updateProtocolUI();
        }
    });
    
    $('#udp-btn').click(function() {
        if (!isSimulationRunning && isTcpMode) {
            isTcpMode = false;
            updateProtocolUI();
        }
    });
    
    $('#send-btn').click(function() {
        if (!isSimulationRunning) {
            startSimulation();
        }
    });
    
    $('#drop-rate').on('input', function() {
        dropRate = $(this).val();
        $('#drop-rate-value').text(dropRate + '%');
    });
    
    $('#anim-speed').on('input', function() {
        animationSpeed = $(this).val();
        updateSpeedDisplay();
        
        // Update speed multiplier based on slider value
        switch(parseInt(animationSpeed)) {
            case 1: speedMultiplier = 2; break;    // Very slow
            case 2: speedMultiplier = 1.5; break;  // Slow
            case 3: speedMultiplier = 1; break;    // Normal
            case 4: speedMultiplier = 0.6; break;  // Fast
            case 5: speedMultiplier = 0.3; break;  // Very fast
        }
    });
    
    // Initialize
    updateProtocolUI();
    updateSpeedDisplay();
    
    // Show router tooltips
    $('.router').hover(
        function() {
            showTooltip($(this), "Network router that forwards packets along different paths");
        },
        hideTooltip
    );
    
    // Functions
    function updateProtocolUI() {
        if (isTcpMode) {
            $('#tcp-btn').addClass('btn-active');
            $('#udp-btn').removeClass('btn-active');
            $('#protocol-title').text('TCP (Transmission Control Protocol)');
            $('#protocol-description').html(
                'TCP is a connection-oriented protocol that guarantees reliable and ordered delivery of data. ' +
                'It uses a three-way handshake (SYN, SYN-ACK, ACK) to establish a connection before data transfer, ' +
                'and ensures all packets are received in the correct order through sequence numbers and acknowledgments.'
            );
        } else {
            $('#tcp-btn').removeClass('btn-active');
            $('#udp-btn').addClass('btn-active');
            $('#protocol-title').text('UDP (User Datagram Protocol)');
            $('#protocol-description').html(
                'UDP is a connectionless protocol that does not guarantee reliable delivery of data. ' +
                'It has no handshake process and simply sends packets without acknowledgment or retransmission. ' +
                'This makes it faster but less reliable than TCP, as packets may be lost or arrive out of order.'
            );
        }
    }
    
    function updateSpeedDisplay() {
        let speedText;
        switch(parseInt(animationSpeed)) {
            case 1: speedText = "Very Slow"; break;
            case 2: speedText = "Slow"; break;
            case 3: speedText = "Normal"; break;
            case 4: speedText = "Fast"; break;
            case 5: speedText = "Very Fast"; break;
            default: speedText = "Normal";
        }
        $('#speed-value').text(speedText);
    }
    
    function logMessage(message, type = '') {
        const logEntry = $('<div class="log-entry"></div>').text(`[${new Date().toLocaleTimeString()}] ${message}`);
        if (type) {
            logEntry.addClass(`log-${type}`);
        }
        $('#console-log').prepend(logEntry);
    }
    
    function updateTimeline(percent) {
        $('#timeline-progress').css('width', `${percent}%`);
    }
    
    function showTooltip(element, text) {
        const tooltip = $('#tooltip');
        const offset = element.offset();
        const elementWidth = element.outerWidth();
        const elementHeight = element.outerHeight();
        
        tooltip.text(text);
        tooltip.css({
            left: offset.left + elementWidth / 2,
            top: offset.top - elementHeight - 10,
            transform: 'translateX(-50%)'
        }).show().css('opacity', 1);
    }
    
    function hideTooltip() {
        $('#tooltip').css('opacity', 0);
        setTimeout(() => $('#tooltip').hide(), 300);
    }
    
    function createPacket(id, type, content) {
        const packet = $('<div class="packet"></div>')
            .addClass(type)
            .text(id)
            .attr('data-id', id)
            .attr('data-content', content)
            .css({
                left: $('.client').position().left + 75,
                top: $('.client').position().top + 50
            });
        
        packet.hover(
            function() {
                const packetInfo = `Packet #${$(this).attr('data-id')}: "${$(this).attr('data-content')}"`;
                showTooltip($(this), packetInfo);
            },
            hideTooltip
        );
        
        $('.network-simulation').append(packet);
        return packet;
    }
    
    function movePacketAlongRoute(packet, routePath, isAck = false, callback) {
        const route = routePath.route;
        movePacketToNextNode(packet, route, 0, isAck, callback);
    }
    
    function movePacketToNextNode(packet, route, currentIndex, isAck, callback) {
        if (currentIndex >= route.length - 1) {
            if (callback) callback();
            return;
        }
        
        const currentNode = $(`.${route[currentIndex]}`);
        const nextNode = $(`.${route[currentIndex + 1]}`);
        
        const duration = 500 * speedMultiplier;
        
        packet.animate({
            left: nextNode.position().left + (nextNode.hasClass('router') ? 30 : 75),
            top: nextNode.position().top + (nextNode.hasClass('router') ? 30 : 50)
        }, duration, function() {
            const nodeName = route[currentIndex + 1].includes('router') ? 
                `Router ${route[currentIndex + 1].charAt(route[currentIndex + 1].length - 1)}` : 
                route[currentIndex + 1].charAt(0).toUpperCase() + route[currentIndex + 1].slice(1);
            
            if (isAck) {
                logMessage(`ACK Packet #${packet.attr('data-id')} reached ${nodeName}`, isTcpMode ? 'tcp' : 'udp');
            } else {
                logMessage(`Packet #${packet.attr('data-id')} routed through ${nodeName}`, isTcpMode ? 'tcp' : 'udp');
            }
            
            // Check if we should drop the packet (UDP only)
            if (!isTcpMode && !isAck && currentIndex < route.length - 2) {
                if (Math.random() * 100 < dropRate) {
                    logMessage(`Packet #${packet.attr('data-id')} DROPPED at ${nodeName}!`, 'udp');
                    packet.css('opacity', 0.3).addClass('dropped');
                    setTimeout(() => packet.remove(), 800);
                    if (callback) callback(true); // true indicates dropped
                    return;
                }
            }
            
            movePacketToNextNode(packet, route, currentIndex + 1, isAck, callback);
        });
    }
    
    function startSimulation() {
        isSimulationRunning = true;
        $('#send-btn').prop('disabled', true);
        $('.packet').remove();
        updateTimeline(0);
        
        const message = $('#message-input').val() || "Hello, Server!";
        logMessage(`Starting ${isTcpMode ? 'TCP' : 'UDP'} simulation with message: "${message}"`, isTcpMode ? 'tcp' : 'udp');
        
        if (isTcpMode) {
            startTcpSimulation(message);
        } else {
            startUdpSimulation(message);
        }
    }
    
    function startTcpSimulation(message) {
        // Phase 1: Connection Establishment (Three-way handshake)
        updateTimeline(10);
        logMessage("TCP Handshake: Sending SYN packet", 'tcp');
        
        const synPacket = createPacket('SYN', 'tcp-packet', 'Connection Request');
        
        // SYN
        movePacketAlongRoute(synPacket, routePaths[0], false, function() {
            updateTimeline(20);
            logMessage("TCP Handshake: Server received SYN", 'tcp');
            
            // SYN-ACK
            const synAckPacket = createPacket('SYN-ACK', 'ack-packet', 'Connection Accepted');
            synAckPacket.css({
                left: $('.server').position().left,
                top: $('.server').position().top + 50
            });
            
            const reversePath = {
                route: routePaths[0].route.slice().reverse(),
                name: routePaths[0].name + ' (reverse)'
            };
            
            movePacketAlongRoute(synAckPacket, reversePath, true, function() {
                updateTimeline(30);
                logMessage("TCP Handshake: Client received SYN-ACK", 'tcp');
                
                // ACK
                const ackPacket = createPacket('ACK', 'ack-packet', 'Connection Confirmed');
                
                movePacketAlongRoute(ackPacket, routePaths[0], true, function() {
                    updateTimeline(40);
                    logMessage("TCP Handshake complete: Connection established", 'tcp');
                    
                    // Phase 2: Data Transfer
                    setTimeout(() => sendTcpData(message), 500 * speedMultiplier);
                });
            });
        });
    }
    
    function sendTcpData(message) {
        updateTimeline(50);
        logMessage("TCP Data Transfer: Breaking message into packets", 'tcp');
        
        // Break message into packets
        const packets = breakIntoPackets(message);
        const totalPackets = packets.length;
        
        logMessage(`TCP Data Transfer: Sending ${totalPackets} packets`, 'tcp');
        
        let sentPackets = 0;
        let ackedPackets = 0;
        
        function sendNextPacket() {
            if (sentPackets < totalPackets) {
                const packet = packets[sentPackets];
                const packetId = sentPackets + 1;
                
                const tcpPacket = createPacket(packetId, 'tcp-packet', packet);
                
                // Choose a random route
                const routeIndex = Math.floor(Math.random() * routePaths.length);
                const selectedRoute = routePaths[routeIndex];
                
                logMessage(`TCP Sending packet #${packetId}: "${packet}" via ${selectedRoute.name}`, 'tcp');
                
                movePacketAlongRoute(tcpPacket, selectedRoute, false, function() {
                    updateTimeline(50 + Math.floor((sentPackets + 1) * 25 / totalPackets));
                    
                    // Send ACK
                    const ackPacket = createPacket(`ACK-${packetId}`, 'ack-packet', `Acknowledging Packet ${packetId}`);
                    ackPacket.css({
                        left: $('.server').position().left,
                        top: $('.server').position().top + 50
                    });
                    
                    const reversePath = {
                        route: selectedRoute.route.slice().reverse(),
                        name: selectedRoute.name + ' (reverse)'
                    };
                    
                    movePacketAlongRoute(ackPacket, reversePath, true, function() {
                        ackedPackets++;
                        logMessage(`TCP Client received ACK for packet #${packetId}`, 'tcp');
                        
                        if (ackedPackets === totalPackets) {
                            // All packets acknowledged
                            completeTcpSimulation(message);
                        }
                    });
                });
                
                sentPackets++;
                setTimeout(sendNextPacket, 300 * speedMultiplier);
            }
        }
        
        sendNextPacket();
    }
    
    function completeTcpSimulation(message) {
        updateTimeline(90);
        logMessage("TCP Data Transfer complete: All packets received and acknowledged", 'tcp');
        
        // Show reconstructed message
        $('#packet-info').text(`Reconstructed message: "${message}"`);
        
        // Connection Termination (simplified)
        const finPacket = createPacket('FIN', 'tcp-packet', 'Connection Close Request');
        
        movePacketAlongRoute(finPacket, routePaths[0], false, function() {
            const finAckPacket = createPacket('FIN-ACK', 'ack-packet', 'Connection Close Accepted');
            finAckPacket.css({
                left: $('.server').position().left,
                top: $('.server').position().top + 50
            });
            
            const reversePath = {
                route: routePaths[0].route.slice().reverse(),
                name: routePaths[0].name + ' (reverse)'
            };
            
            movePacketAlongRoute(finAckPacket, reversePath, true, function() {
                updateTimeline(100);
                logMessage("TCP Connection closed gracefully", 'tcp');
                
                simulationCompleted();
            });
        });
    }
    
    function startUdpSimulation(message) {
        updateTimeline(20);
        logMessage("UDP: No connection setup needed", 'udp');
        
        // Break message into packets
        const packets = breakIntoPackets(message);
        const totalPackets = packets.length;
        
        logMessage(`UDP: Sending ${totalPackets} packets directly`, 'udp');
        
        let sentPackets = 0;
        let deliveredPackets = 0;
        let droppedPackets = 0;
        const receivedContent = [];
        
        function sendNextUdpPacket() {
            if (sentPackets < totalPackets) {
                const packet = packets[sentPackets];
                const packetId = sentPackets + 1;
                
                const udpPacket = createPacket(packetId, 'udp-packet', packet);
                
                // Choose a random route
                const routeIndex = Math.floor(Math.random() * routePaths.length);
                const selectedRoute = routePaths[routeIndex];
                
                logMessage(`UDP Sending packet #${packetId}: "${packet}" via ${selectedRoute.name}`, 'udp');
                
                movePacketAlongRoute(udpPacket, selectedRoute, false, function(dropped) {
                    if (dropped) {
                        droppedPackets++;
                    } else {
                        deliveredPackets++;
                        receivedContent[packetId - 1] = packet;
                        
                        // Show current reconstructed message (might have gaps)
                        const reconstructed = receivedContent.join('');
                        $('#packet-info').text(`Reconstructed message so far: "${reconstructed}"`);
                    }
                    
                    updateTimeline(20 + Math.floor((sentPackets + 1) * 60 / totalPackets));
                    
                    if (sentPackets === totalPackets - 1) {
                        setTimeout(() => completeUdpSimulation(message, deliveredPackets, droppedPackets), 
                            1000 * speedMultiplier);
                    }
                });
                
                sentPackets++;
                setTimeout(sendNextUdpPacket, 300 * speedMultiplier);
            }
        }
        
        sendNextUdpPacket();
    }
    
    function completeUdpSimulation(originalMessage, delivered, dropped) {
        updateTimeline(100);
        
        const receivedPercent = Math.floor((delivered / (delivered + dropped)) * 100);
        
        if (dropped > 0) {
            const reconstructedWithLoss = originalMessage.split('').map(char => {
                return Math.random() * 100 < receivedPercent ? char : '_';
            }).join('');
            
            logMessage(`UDP Transfer completed: ${delivered} packets delivered, ${dropped} packets lost (${receivedPercent}% success)`, 'udp');
            $('#packet-info').text(`Reconstructed message with loss: "${reconstructedWithLoss}"`);
        } else {
            logMessage(`UDP Transfer completed: All ${delivered} packets delivered successfully`, 'udp');
            $('#packet-info').text(`Reconstructed message: "${originalMessage}"`);
        }
        
        simulationCompleted();
    }
    
    function breakIntoPackets(message) {
        const packets = [];
        for (let i = 0; i < message.length; i += packetSize) {
            packets.push(message.substr(i, packetSize));
        }
        return packets;
    }
    
    function simulationCompleted() {
        setTimeout(() => {
            isSimulationRunning = false;
            $('#send-btn').prop('disabled', false);
            logMessage("Simulation complete. Ready for new transmission.");
        }, 1000);
    }
});