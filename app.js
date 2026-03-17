document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('purchase-form');
    const ticketSelect = document.getElementById('tickets');
    const priceDisplay = document.getElementById('total-price');
    const payBtn = document.getElementById('pay-btn');
    const successState = document.getElementById('success-state');
    const generatedCodeDisplay = document.getElementById('generated-code');

    const BASE_PRICE = 500;

    // Update price dynamically
    ticketSelect.addEventListener('change', (e) => {
        const count = parseInt(e.target.value);
        const total = BASE_PRICE * count;
        priceDisplay.textContent = `₹${total}`;
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Disable button during 'processing'
        const originalText = payBtn.innerHTML;
        payBtn.innerHTML = 'Submitting Request...';
        payBtn.disabled = true;

        setTimeout(() => {
            // Generate unique code
            const uniqueCode = generateTicketCode();

            // Collect data
            const ticketData = {
                id: Date.now().toString(),
                name: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                count: parseInt(ticketSelect.value),
                transactionId: document.getElementById('transactionId').value,
                code: uniqueCode,
                purchaseDate: new Date().toISOString(),
                status: 'pending' // Changed to pending for UPI approval
            };

            // Save to localStorage
            saveTicket(ticketData);

            // Show success UI
            form.classList.add('hidden');
            document.querySelector('.checkout-panel h3').classList.add('hidden');

            generatedCodeDisplay.textContent = uniqueCode;
            successState.classList.remove('hidden');

        }, 1500); // 1.5s fake delay for realism
    });

    // Helper functions
    function generateTicketCode() {
        const prefix = "SAKA";
        const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
        const randomNumbers = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}-${randomString}-${randomNumbers}`;
    }

    function saveTicket(ticket) {
        let existingTickets = [];
        const stored = localStorage.getItem('blr_saka_tickets');
        if (stored) {
            existingTickets = JSON.parse(stored);
        }
        existingTickets.push(ticket);
        localStorage.setItem('blr_saka_tickets', JSON.stringify(existingTickets));
    }
});
