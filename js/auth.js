function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("error");

  if (!username || !password) {
    error.textContent = "❌ Please fill in all fields";
    error.style.display = "block";
    return;
  }

  error.textContent = "⏳ Logging in...";
  error.style.display = "block";
  error.style.color = "#FFA500";
  const credentials = btoa(`${username}:${password}`);

  fetch("https://learn.reboot01.com/api/auth/signin", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json"
    }
  })
  .then(res => {
    if (!res.ok) {
      if (res.status === 401 || res.status === 400) {
        throw new Error("Invalid username or password. Please check your credentials.");
      }
      throw new Error(`Login failed: ${res.statusText}`);
    }
    return res.json();
  })
  .then(data => {
    if (!data || !data.token) {
      throw new Error("Invalid response from server - no token received");
    }
    localStorage.setItem("jwt", data.token);
    error.textContent = "✅ Login successful! Redirecting...";
    error.style.color = "#4CAF50";
    setTimeout(() => {
      window.location.href = "profile.html";
    }, 500);
  })
  .catch((err) => {
    error.textContent = "❌ " + (err.message || "Invalid username or password");
    error.style.color = "#f44336";
    console.error(err);
  });
}


function logout() {
  localStorage.removeItem("jwt");
  localStorage.removeItem("userId");
  window.location.href = "index.html";
}