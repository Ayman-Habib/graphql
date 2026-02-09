const API_URL = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

function graphqlRequest(query, variables = {}) {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    console.error("No JWT token found");
    window.location.href = "index.html";
    return Promise.reject("No JWT");
  }
  
  return fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`
    },
    body: JSON.stringify({ query, variables })
  })
  .then(res => {
    if (!res.ok) {
      console.error(`GraphQL HTTP Error: ${res.statusText}`);
      return res.json().then(data => {
        throw new Error(`GraphQL request failed: ${res.statusText}`);
      });
    }
    return res.json();
  })
  .then(data => {
    if (data.errors) {
      console.warn("GraphQL Errors:", data.errors);
      // If authentication error, redirect to login
      if (data.errors.some(e => e.message && e.message.toLowerCase().includes('unauthor'))) {
        handleAuthError();
      }
    }
    return data;
  })
  .catch(err => {
    console.error("GraphQL Error:", err);
    throw err;
  });
}

// Parse JWT to get user ID
function getUserIdFromJWT() {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) return null;
  
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return payload.sub;
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
}

// Handle authentication errors
function handleAuthError() {
  localStorage.removeItem("jwt");
  localStorage.removeItem("userId");
  window.location.href = "index.html";
}
