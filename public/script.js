const form = document.getElementById('contactForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText; 

    submitBtn.disabled = true;
    submitBtn.innerText = 'Sending...';
    

    const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
        bot_check: document.getElementById('bot_check').value
    };

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            alert('Thanks! ' + result.message);
            form.reset();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (err) {
        alert('Server connection failed.');
    }

    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
});