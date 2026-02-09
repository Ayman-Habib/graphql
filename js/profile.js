if (!localStorage.getItem("jwt")) {
  window.location.href = "index.html";
}

// Section 1: User Info (Simple Query - Basic)
graphqlRequest(`
{
  user {
    id
    login
  }
}
`).then(data => {
  if (data.errors) {
    console.error("GraphQL Error:", data.errors);
    return;
  }
  const user = data.data?.user?.[0];
  if (user) {
    localStorage.setItem("userId", user.id);
    document.getElementById("user-info").innerHTML = `
      <h3>👤 Basic Information</h3>
      <p><strong>ID:</strong> ${user.id}</p>
      <p><strong>Login:</strong> ${user.login}</p>
    `;
  } else {
    document.getElementById("user-info").innerHTML = `<h3>⚠️ User information not available</h3>`;
  }
}).catch(err => {
  console.error("Error fetching user:", err);
  document.getElementById("user-info").innerHTML = `<h3>❌ Error loading user info</h3>`;
});

// Section 2: XP (Query with where clause - Using Arguments)
graphqlRequest(`
{
  transaction(where: { type: { _eq: "xp" }}) {
    amount
    createdAt
    path
    objectId
  }
}
`).then(data => {
  const xp = data.data?.transaction || [];
  if (xp.length === 0) {
    document.getElementById("xp-info").innerHTML = `
      <h3>⚡ Total XP Earned</h3>
      <p>No XP transactions found</p>
    `;
    return;
  }
  
  const totalXP = xp.reduce((s, x) => s + x.amount, 0);
  const recentXP = xp[xp.length - 1];

  document.getElementById("xp-info").innerHTML = `
    <h3>⚡ Total XP Earned</h3>
    <p style="font-size: 2rem; color: #2196F3; font-weight: bold;">${totalXP.toLocaleString()} XP</p>
    <p><small>Total Transactions: ${xp.length}</small></p>
    <p><small>Latest XP: ${recentXP.amount} XP on ${new Date(recentXP.createdAt).toLocaleDateString()}</small></p>
  `;

  drawXPGraph(xp);
  drawXPByProjectGraph(xp); // Draw additional graph
}).catch(err => {
  console.error("Error fetching XP:", err);
  document.getElementById("xp-info").innerHTML = `<h3>⚠️ Error loading XP data</h3>`;
});

// Section 3: Pass/Fail Ratio (Nested Query)
graphqlRequest(`
{
  result(order_by: {createdAt: desc}, limit: 200) {
    id
    grade
    path
    createdAt
    object {
      name
      type
    }
  }
}
`).then(data => {
  const results = data.data?.result || [];
  if (results.length === 0) {
    document.getElementById("result-info").innerHTML = `
      <h3>✅ Results Summary</h3>
      <p>No results found</p>
    `;
    return;
  }

  const pass = results.filter(r => r.grade === 1).length;
  const fail = results.filter(r => r.grade === 0 || r.grade === null).length;
  const successRate = pass + fail > 0 ? ((pass / (pass + fail)) * 100).toFixed(1) : 0;

  document.getElementById("result-info").innerHTML = `
    <h3>✅ Results Summary</h3>
    <p><strong>PASS:</strong> <span style="color: #4CAF50; font-weight: bold;">${pass}</span></p>
    <p><strong>FAIL:</strong> <span style="color: #f44336; font-weight: bold;">${fail}</span></p>
    <p><strong>Success Rate:</strong> <span style="color: #2196F3;">${successRate}%</span></p>
    <p><small>Total Evaluated: ${pass + fail}</small></p>
  `;

  if (pass > 0 || fail > 0) {
    drawResultGraph(pass, fail);
  }
}).catch(err => {
  console.error("Error fetching results:", err);
  document.getElementById("result-info").innerHTML = `<h3>⚠️ Error loading results</h3>`;
});

// Section 4: Audit Ratio (Nested Query with Arguments)
graphqlRequest(`
{
  user {
    login
    auditRatio
    totalUp
    totalDown
  }
}
`).then(data => {
  const user = data.data?.user?.[0];
  if (user && (user.auditRatio || user.totalUp)) {
    const ratio = user.auditRatio || (user.totalUp && user.totalDown ? user.totalUp / user.totalDown : 0);
    const upValue = user.totalUp || 0;
    const downValue = user.totalDown || 0;
    
    document.getElementById("audit-info").innerHTML = `
      <h3>🔍 Audit Ratio</h3>
      <p><strong>Ratio:</strong> <span style="font-size: 1.5rem; color: #FF9800;">${ratio?.toFixed(2) || 'N/A'}:1</span></p>
      <p><strong>Audits Done (Up):</strong> <span style="color: #2196F3;">${upValue}</span></p>
      <p><strong>Audits Received (Down):</strong> <span style="color: #FF9800;">${downValue}</span></p>
    `;
    
    if (upValue > 0 || downValue > 0) {
      drawAuditRatioGraph(upValue, downValue);
    }
  } else {
    document.getElementById("audit-info").innerHTML = `
      <h3>🔍 Audit Ratio</h3>
      <p>No audit data available yet</p>
    `;
  }
}).catch(err => {
  console.error("Error fetching audit ratio:", err);
  document.getElementById("audit-info").innerHTML = `<h3>⚠️ Error loading audit data</h3>`;
});

// Section 5: Skills (Additional Information - Query with Arguments)
graphqlRequest(`
{
  userSkill(order_by: {skillId: asc}) {
    id
    skillId
    skill {
      id
      name
    }
  }
}
`).then(data => {
  const skills = data.data?.userSkill || [];
  if (skills.length > 0) {
    const skillList = skills.slice(0, 10).map(s => s.skill?.name || 'Unknown').join(', ');
    let skillsHTML = `
      <h3>🎯 Skills</h3>
      <p><strong>Learned Skills:</strong> ${skillList}</p>
      <p><small>Total: ${skills.length} skills</small></p>
    `;
    
    // Create a new section for skills if it doesn't exist
    const skillsSection = document.createElement('div');
    skillsSection.id = 'skills-info';
    skillsSection.className = 'info-section';
    skillsSection.innerHTML = skillsHTML;
    document.querySelector('.logout-btn').parentNode.insertBefore(skillsSection, document.getElementById('xp-info'));
  }
}).catch(err => {
  console.warn("Skills not available:", err);
});
