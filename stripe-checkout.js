document.addEventListener("DOMContentLoaded", function () {
  var upgradeBtn = document.getElementById('upgrade-btn');
  var stripeMessage = document.getElementById('stripe-message');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', async function () {
      upgradeBtn.disabled = true;
      stripeMessage.textContent = "Redirecting to secure payment...";
      // Call your backend to create a Stripe Checkout session
      const response = await fetch('/api/stripe-session', { method: 'POST' });
      const data = await response.json();
      if (!data.sessionId) {
        stripeMessage.textContent = "Error creating payment session. Please try again.";
        upgradeBtn.disabled = false;
        return;
      }
      // Initialize Stripe with your public key
      var stripe = Stripe('pk_test_YOUR_PUBLIC_KEY'); // Replace with your Stripe public key
      // Redirect to Stripe Checkout
      stripe.redirectToCheckout({ sessionId: data.sessionId });
    });
  }
});