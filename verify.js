document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('verify-form');
    const input = document.getElementById('ticket-code');
    const resultContainer = document.getElementById('result-container');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const code = input.value.trim().toUpperCase();
        if (!code) return;

        verifyCode(code);

        // Clear input and refocus for rapid scanning
        input.value = '';
        input.focus();
    });

    renderPendingList();

    function verifyCode(inputCode) {
        // Clear previous results
        resultContainer.innerHTML = '';

        const stored = localStorage.getItem('blr_saka_tickets');
        if (!stored) {
            showResult('invalid', null);
            return;
        }

        const tickets = JSON.parse(stored);
        const ticketIndex = tickets.findIndex(t => t.code === inputCode);

        if (ticketIndex === -1) {
            showResult('invalid', null);
        } else {
            const ticket = tickets[ticketIndex];

            if (ticket.status === 'valid') {
                // Mark as scanned and save back
                ticket.status = 'scanned';
                ticket.scannedAt = new Date().toISOString();
                tickets[ticketIndex] = ticket;
                localStorage.setItem('blr_saka_tickets', JSON.stringify(tickets));

                showResult('valid', ticket);
            } else if (ticket.status === 'pending') {
                showResult('pending', ticket);
            } else {
                showResult('scanned', ticket);
            }
        }
    }

    function showResult(state, ticket) {
        const card = document.createElement('div');

        if (state === 'valid') {
            card.className = 'result-card valid';
            card.innerHTML = `
                <div class="status-icon">✅</div>
                <div class="status-title">VALID ENTRY</div>
                <p>Allow entry for <span class="highlight-count">${ticket.count}</span> guests</p>
                <div class="ticket-details">
                    <div class="detail-row">
                        <span>Name:</span>
                        <span class="detail-value">${ticket.name}</span>
                    </div>
                    <div class="detail-row">
                        <span>Code:</span>
                        <span class="detail-value">${ticket.code}</span>
                    </div>
                </div>
            `;
        } else if (state === 'scanned') {
            const scanTime = new Date(ticket.scannedAt).toLocaleTimeString();
            card.className = 'result-card scanned';
            card.innerHTML = `
                <div class="status-icon">⚠️</div>
                <div class="status-title">ALREADY SCANNED</div>
                <p>This ticket was already used.</p>
                <div class="ticket-details">
                    <div class="detail-row">
                        <span>Scanned At:</span>
                        <span class="detail-value">${scanTime}</span>
                    </div>
                    <div class="detail-row">
                        <span>Name:</span>
                        <span class="detail-value">${ticket.name}</span>
                    </div>
                </div>
            `;
        } else if (state === 'pending') {
            card.className = 'result-card scanned';
            card.innerHTML = `
                <div class="status-icon">⏳</div>
                <div class="status-title">TICKET PENDING</div>
                <p>This ticket has not been approved yet. Check the dashboard below.</p>
                <div class="ticket-details">
                    <div class="detail-row">
                        <span>Txn ID:</span>
                        <span class="detail-value">${ticket.transactionId}</span>
                    </div>
                </div>
            `;
        } else {
            card.className = 'result-card invalid';
            card.innerHTML = `
                <div class="status-icon">❌</div>
                <div class="status-title">INVALID TICKET</div>
                <p>This code was not found in the system.</p>
            `;
        }

        resultContainer.appendChild(card);

        // Auto-remove success card after 5 seconds to clear screen for next person, 
        // but keep warnings longer
        if (state === 'valid') {
            setTimeout(() => {
                if (card.parentNode === resultContainer) {
                    resultContainer.removeChild(card);
                }
            }, 6000);
        }
    }

    // Admin Dashboard Logic
    function renderPendingList() {
        const listContainer = document.getElementById('pending-list');
        const stored = localStorage.getItem('blr_saka_tickets');

        if (!stored) {
            listContainer.innerHTML = '<div class="empty-state">No pending requests</div>';
            return;
        }

        const tickets = JSON.parse(stored);
        const pendingTickets = tickets.filter(t => t.status === 'pending');

        if (pendingTickets.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">All caught up!</div>';
            return;
        }

        listContainer.innerHTML = pendingTickets.map(ticket => `
            <div class="pending-item">
                <div class="item-info">
                    <strong>Txn: ${ticket.transactionId || 'N/A'}</strong>
                    <span>${ticket.name} • ${ticket.count} Ticket(s) • ₹${ticket.count * 500}</span>
                </div>
                <div class="action-btns">
                    <button class="btn-approve" onclick="updateTicketStatus('${ticket.id}', 'valid')">Approve</button>
                    <button class="btn-reject" onclick="updateTicketStatus('${ticket.id}', 'invalid')">Reject</button>
                </div>
            </div>
        `).join('');
    }

    // Expose to window for inline onclick handlers
    window.updateTicketStatus = function (ticketId, newStatus) {
        const stored = localStorage.getItem('blr_saka_tickets');
        if (!stored) return;

        const tickets = JSON.parse(stored);
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);

        if (ticketIndex !== -1) {
            tickets[ticketIndex].status = newStatus;
            localStorage.setItem('blr_saka_tickets', JSON.stringify(tickets));
            renderPendingList(); // Re-render table

            // If we just modified a ticket that is lingering in scanner results, clear scanner
            resultContainer.innerHTML = '';
        }
    };
});
