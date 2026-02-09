function drawAuditRatioGraph(up, down) {
  if (!up && !down) return;
  
  const total = up + down;
  const upPercentage = (up / total) * 100;
  const downPercentage = (down / total) * 100;
  
  const svg = `
    <div class="graph">
      <h4>🔍 Audit Ratio</h4>
      <svg width="220" height="220" viewBox="0 0 220 220">
        <!-- Background circle -->
        <circle r="80" cx="110" cy="110" fill="none" stroke="#eee" stroke-width="30"></circle>
        <!-- Up segment (Blue) -->
        <circle r="80" cx="110" cy="110" 
          fill="none" 
          stroke="#2196F3" 
          stroke-width="30"
          stroke-dasharray="${upPercentage * 5.024} 502.4"
          stroke-linecap="round"
          transform="rotate(-90 110 110)"></circle>
        <!-- Down segment (Orange) -->
        <circle r="80" cx="110" cy="110" 
          fill="none" 
          stroke="#FF9800" 
          stroke-width="30"
          stroke-dasharray="${downPercentage * 5.024} 502.4"
          stroke-linecap="round"
          transform="rotate(${upPercentage * 3.6 - 90} 110 110)"></circle>
        <!-- Center text -->
        <text x="110" y="115" text-anchor="middle" font-size="20" font-weight="bold" fill="#333">
          ${(up / down).toFixed(2)}:1
        </text>
      </svg>
      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;"><strong style="color: #2196F3;">⬆ Audits Done:</strong> ${up}</p>
        <p style="margin: 5px 0;"><strong style="color: #FF9800;">⬇ Audits Received:</strong> ${down}</p>
      </div>
    </div>
  `;
  document.getElementById("graphs").innerHTML += svg;
}

function drawResultGraph(pass, fail) {
  const total = pass + fail;
  if (total === 0) return;
  
  const passPercentage = (pass / total) * 100;
  const failPercentage = 100 - passPercentage;
  
  const svg = `
    <div class="graph">
      <h4>📊 Pass/Fail Ratio</h4>
      <svg width="220" height="220" viewBox="0 0 220 220">
        <!-- Background circle -->
        <circle r="80" cx="110" cy="110" fill="none" stroke="#eee" stroke-width="30"></circle>
        <!-- Pass segment (Green) - starts at top -->
        <circle r="80" cx="110" cy="110" 
          fill="none" 
          stroke="#4CAF50" 
          stroke-width="30"
          stroke-dasharray="${passPercentage * 5.024} 502.4"
          stroke-linecap="round"
          transform="rotate(-90 110 110)"></circle>
        <!-- Fail segment (Red) -->
        <circle r="80" cx="110" cy="110" 
          fill="none" 
          stroke="#f44336" 
          stroke-width="30"
          stroke-dasharray="${failPercentage * 5.024} 502.4"
          stroke-linecap="round"
          transform="rotate(${passPercentage * 3.6 - 90} 110 110)"></circle>
        <!-- Center text -->
        <text x="110" y="115" text-anchor="middle" font-size="24" font-weight="bold" fill="#333">
          ${passPercentage.toFixed(0)}%
        </text>
        <text x="110" y="135" text-anchor="middle" font-size="12" fill="#666">
          PASS
        </text>
      </svg>
      <div style="margin-top: 15px;">
        <p style="margin: 5px 0;"><strong style="color: #4CAF50;">✓ PASS:</strong> ${pass}</p>
        <p style="margin: 5px 0;"><strong style="color: #f44336;">✗ FAIL:</strong> ${fail}</p>
      </div>
    </div>
  `;
  document.getElementById("graphs").innerHTML += svg;
}

function drawXPGraph(xp) {
  if (!xp || xp.length === 0) return;
  
  let bars = "";
  const maxAmount = Math.max(...xp.map(x => x.amount));
  const barWidth = 15;
  const spacing = 3;
  const maxBars = 12;
  
  // Sort by date and take last maxBars entries
  const recentXP = xp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, maxBars);
  
  recentXP.reverse().forEach((x, i) => {
    const height = (x.amount / maxAmount) * 100;
    const xPos = i * (barWidth + spacing) + 10;
    const yPos = 120 - height;
    
    bars += `
      <g>
        <rect x="${xPos}" y="${yPos}" 
              width="${barWidth}" height="${height}" 
              fill="#2196F3" stroke="#1565c0" stroke-width="1"
              rx="2"
              title="${x.amount} XP - ${new Date(x.createdAt).toLocaleDateString()}">
        </rect>
        <text x="${xPos + barWidth/2}" y="135" 
              text-anchor="middle" font-size="8" fill="#666">
          ${(x.amount/1000).toFixed(0)}k
        </text>
      </g>
    `;
  });

  const svg = `
    <div class="graph">
      <h4>📈 Recent XP Progress (Last ${Math.min(maxBars, recentXP.length)})</h4>
      <svg width="380" height="160" style="border: 1px solid #eee; border-radius: 5px;">
        <!-- Y-axis -->
        <line x1="30" y1="120" x2="365" y2="120" stroke="#ccc" stroke-width="1" stroke-dasharray="2,2"/>
        <!-- X-axis -->
        <line x1="30" y1="20" x2="30" y2="120" stroke="#333" stroke-width="2"/>
        <line x1="30" y1="120" x2="365" y2="120" stroke="#333" stroke-width="2"/>
        <!-- Y-axis label -->
        <text x="5" y="25" font-size="10" fill="#666">Max</text>
        <text x="5" y="125" font-size="10" fill="#666">0</text>
        ${bars}
      </svg>
      <p style="color: #888; font-size: 0.9rem;">Hover over bars for details</p>
    </div>
  `;

  document.getElementById("graphs").innerHTML += svg;
}

// Additional Graph: XP by Project/Path (Nested query visualization)
function drawXPByProjectGraph(xp) {
  if (!xp || xp.length === 0) return;
  
  // Group XP by project path
  const projectMap = {};
  xp.forEach(x => {
    const project = x.path || "Unknown";
    projectMap[project] = (projectMap[project] || 0) + x.amount;
  });
  
  // Get top 8 projects
  const topProjects = Object.entries(projectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  
  if (topProjects.length === 0) return;
  
  const maxXP = Math.max(...topProjects.map(p => p[1]));
  const barWidth = 35;
  const spacing = 5;
  
  let bars = "";
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"];
  
  topProjects.forEach((project, i) => {
    const [name, amount] = project;
    const height = (amount / maxXP) * 130;
    const xPos = i * (barWidth + spacing) + 20;
    const yPos = 150 - height;
    const shortName = name.split('/').pop() || name.substring(0, 8);
    
    bars += `
      <g>
        <rect x="${xPos}" y="${yPos}" 
              width="${barWidth}" height="${height}" 
              fill="${colors[i % colors.length]}" 
              stroke="#333" stroke-width="1"
              rx="3"
              title="${shortName}: ${amount} XP">
        </rect>
        <text x="${xPos + barWidth/2}" y="170" 
              text-anchor="middle" font-size="9" fill="#333" font-weight="bold">
          ${shortName.substring(0, 6)}
        </text>
        <text x="${xPos + barWidth/2}" y="180" 
              text-anchor="middle" font-size="8" fill="#666">
          ${(amount/1000).toFixed(1)}k
        </text>
      </g>
    `;
  });
  
  const svg = `
    <div class="graph">
      <h4>🎯 XP Distribution by Project</h4>
      <svg width="420" height="200" style="border: 1px solid #eee; border-radius: 5px;">
        <!-- Y-axis -->
        <line x1="10" y1="150" x2="405" y2="150" stroke="#333" stroke-width="2"/>
        <!-- X-axis -->
        <line x1="10" y1="20" x2="10" y2="150" stroke="#333" stroke-width="2"/>
        <!-- Y-axis label -->
        <text x="0" y="25" font-size="9" fill="#666">Max</text>
        <text x="0" y="152" font-size="9" fill="#666">0</text>
        <!-- Grid lines -->
        <line x1="10" y1="90" x2="405" y2="90" stroke="#eee" stroke-width="1" stroke-dasharray="2,2"/>
        ${bars}
      </svg>
      <p style="color: #888; font-size: 0.85rem;">Top 8 projects by XP earned</p>
    </div>
  `;
  
  document.getElementById("graphs").innerHTML += svg;
}
