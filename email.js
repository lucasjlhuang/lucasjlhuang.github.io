document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("my-form"); 
  const status = document.getElementById("my-form-status");
  const airplaneWrapper = document.querySelector(".airplane-wrapper");

  if (!form || !airplaneWrapper) return;

  async function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    const submitBtn = document.getElementById("submit-btn");
    
    // Trigger the flight
    airplaneWrapper.classList.remove("returning");
    airplaneWrapper.classList.add("flying");
    
    submitBtn.disabled = true;
    
    // REMOVED: status.innerHTML = "Sending..."; 
    // REMOVED: status.classList.add("show");

    fetch(event.target.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(response => {
      if (response.ok) {
        status.innerHTML = "Sent! Looking forward to talking :)";
        status.classList.add("show"); // Show only on success
        form.reset();
      } else {
        status.innerHTML = "Hey! Fill in all the fields then try again";
        status.classList.add("show"); // Show only on error
      }
      
      setTimeout(() => {
        status.classList.remove("show");
        airplaneWrapper.classList.remove("flying");
        airplaneWrapper.classList.add("returning");
        submitBtn.disabled = false;
      }, 3000);

    }).catch(error => {
      submitBtn.disabled = false;
      status.innerHTML = "Connection error.";
      status.classList.add("show");
      
      airplaneWrapper.classList.remove("flying");
      airplaneWrapper.classList.add("returning");
      
      setTimeout(() => {
        status.classList.remove("show");
      }, 3000);
    });
  }

  form.addEventListener("submit", handleSubmit);
});