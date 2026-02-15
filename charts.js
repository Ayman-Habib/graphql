class ChartGenerator {
    constructor() {
        this.colors = {
            primary: '#4a6fa5',
            secondary: '#166088',
            accent: '#4fc3a1',
            success: '#28a745',
            danger: '#e74c3c',
            warning: '#ffc107',
            info: '#17a2b8'
        };
    }

    // Generate XP over time line chart
    generateXPChart(svgElement, transactions) {
        try {
            const svg = d3.select(svgElement);
            svg.selectAll("*").remove();
            
            if (!transactions || transactions.length === 0) {
                svg.append("text")
                    .attr("x", 400)
                    .attr("y", 200)
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("fill", "#666")
                    .text("No XP data available");
                return;
            }
            
            const margin = { top: 20, right: 30, bottom: 40, left: 60 };
            const width = 800 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;
            
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            // Parse dates and sort
            const data = transactions.map(t => ({
                date: new Date(t.createdAt),
                xp: t.amount || 0
            })).sort((a, b) => a.date - b.date);
            
            // Calculate cumulative XP
            let cumulative = 0;
            data.forEach(d => {
                cumulative += d.xp;
                d.cumulativeXP = cumulative;
            });
            
            // Create scales
            const x = d3.scaleTime()
                .domain(d3.extent(data, d => d.date))
                .range([0, width])
                .nice();
            
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.cumulativeXP)])
                .nice()
                .range([height, 0]);
            
            // Create line generator
            const line = d3.line()
                .x(d => x(d.date))
                .y(d => y(d.cumulativeXP))
                .curve(d3.curveMonotoneX);
            
            // Add grid lines
            g.append("g")
                .attr("class", "grid")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x)
                    .tickSize(-height)
                    .tickFormat("")
                )
                .selectAll("line")
                .attr("stroke", "#e0e0e0")
                .attr("stroke-dasharray", "2,2");
            
            g.append("g")
                .attr("class", "grid")
                .call(d3.axisLeft(y)
                    .tickSize(-width)
                    .tickFormat("")
                )
                .selectAll("line")
                .attr("stroke", "#e0e0e0")
                .attr("stroke-dasharray", "2,2");
            
            // Add axes
            const xAxis = g.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));
            
            xAxis.selectAll("text").style("fill", "#000");
            xAxis.selectAll("line").style("stroke", "#000");
            xAxis.selectAll("path").style("stroke", "#000");
            
            xAxis.append("text")
                .attr("fill", "#000")
                .attr("x", width)
                .attr("y", -10)
                .attr("text-anchor", "end")
                .text("Date");
            
            const yAxis = g.append("g")
                .call(d3.axisLeft(y));
            
            yAxis.selectAll("text").style("fill", "#000");
            yAxis.selectAll("line").style("stroke", "#000");
            yAxis.selectAll("path").style("stroke", "#000");
            
            yAxis.append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("y", 15)
                .attr("x", -height / 2)
                .attr("text-anchor", "middle")
                .text("Cumulative XP");
            
            // Add line
            g.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", this.colors.primary)
                .attr("stroke-width", 3)
                .attr("d", line);
            
            // Add data points (sample for performance)
            const sampleRate = Math.max(1, Math.floor(data.length / 15));
            const sampledData = data.filter((d, i) => i % sampleRate === 0);
            
            g.selectAll(".dot")
                .data(sampledData)
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", d => x(d.date))
                .attr("cy", d => y(d.cumulativeXP))
                .attr("r", 4)
                .attr("fill", this.colors.secondary)
                .attr("stroke", "white")
                .attr("stroke-width", 1)
                .append("title")
                .text(d => `Date: ${d.date.toLocaleDateString()}\nXP: ${d.xp}\nTotal: ${d.cumulativeXP}`);
            
            // Add area under the line
            const area = d3.area()
                .x(d => x(d.date))
                .y0(height)
                .y1(d => y(d.cumulativeXP))
                .curve(d3.curveMonotoneX);
            
            g.append("path")
                .datum(data)
                .attr("fill", this.colors.primary)
                .attr("fill-opacity", 0.1)
                .attr("d", area);
                
        } catch (error) {
            console.error('Error generating XP chart:', error);
            const svg = d3.select(svgElement);
            svg.selectAll("*").remove();
            svg.append("text")
                .attr("x", 400)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("fill", "#e74c3c")
                .text("Error generating chart");
        }
    }

    // Generate audit ratio pie chart
    generateAuditChart(svgElement, auditData) {
        try {
            const svg = d3.select(svgElement);
            svg.selectAll("*").remove();
            
            const width = 410;
            const height = 400;
            const radius = Math.min(width, height) / 2 - 50;
            
            const g = svg.append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`);
            
            const statusColors = {
                "Succeeded": "#4caf50",
                "Failed": "#f44336",
                "Expired": "#ff9800",
                "Pending": "#2196f3",
                "Done": this.colors.success,
                "Received": this.colors.accent
            };
            
            const color = d3.scaleOrdinal()
                .domain(["Succeeded", "Failed", "Expired", "Pending", "Done", "Received"])
                .range([statusColors["Succeeded"], statusColors["Failed"], statusColors["Expired"], statusColors["Pending"], statusColors["Done"], statusColors["Received"]]);
            
            const pie = d3.pie()
                .value(d => d.value)
                .sort(null);
            
            const arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);
            
            const outerArc = d3.arc()
                .innerRadius(radius * 0.8)
                .outerRadius(radius * 0.8);
            
            const data = auditData || [{ label: "Done", value: 0 }, { label: "Received", value: 0 }];
            
            const arcs = g.selectAll(".arc")
                .data(pie(data))
                .enter()
                .append("g")
                .attr("class", "arc");
            
            // Add pie slices
            arcs.append("path")
                .attr("d", arc)
                .attr("fill", d => color(d.data.label))
                .attr("stroke", "white")
                .style("stroke-width", "2px")
                .style("opacity", 0.8);
            
            // Add percentage labels inside slices
            arcs.append("text")
                .attr("transform", d => `translate(${arc.centroid(d)})`)
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .style("fill", "white")
                .style("font-weight", "bold")
                .style("font-size", "14px")
                .text(d => {
                    const total = data.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? Math.round((d.data.value / total) * 100) : 0;
                    return percentage > 5 ? `${percentage}%` : '';
                });
            
        } catch (error) {
            console.error('Error generating audit chart:', error);
            const svg = d3.select(svgElement);
            svg.selectAll("*").remove();
            svg.append("text")
                .attr("x", 200)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("fill", "#e74c3c")
                .text("Error generating audit chart");
        }
    }

    // Generate projects chart with detailed information
// Generate projects chart with detailed information - نسخة مبسطة ومضمونة 100%
generateProjectsChart(svgElement, projectData) {
    try {
        const svg = d3.select(svgElement);
        svg.selectAll("*").remove();
        
        
        if (!projectData || projectData.length === 0) {
            svg.append("text")
                .attr("x", 400)
                .attr("y", 200)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("fill", "#666")
                .text("No projects data available");
            return;
        }

       
        const width = 800;
        const height = 450;
        
        
        let validData = projectData.filter(d => d.label !== "No Data" && d.value > 0);
        if (validData.length === 0) {
            validData = [{ label: "No Data", value: 1, color: '#cccccc' }];
        }
        
        
        const totalProjects = validData.reduce((sum, item) => sum + item.value, 0);
        
       
        const leftX = 200;
        const leftY = 200;
        
        
        const radius = 120;
        
        const pie = d3.pie().value(d => d.value).sort(null);
        const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
        
        
        const pieGroup = svg.append("g")
            .attr("transform", `translate(${leftX}, ${leftY})`);
        
        
        const arcs = pieGroup.selectAll(".arc")
            .data(pie(validData))
            .enter()
            .append("g")
            .attr("class", "arc");
        
        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => d.data.color)
            .attr("stroke", "white")
            .style("stroke-width", "2px");
        
        
        arcs.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("fill", "white")
            .style("font-weight", "bold")
            .style("font-size", "14px")
            .text(d => {
                const p = Math.round((d.data.value / totalProjects) * 100);
                return p >= 5 ? `${p}%` : '';
            });
        
        
        pieGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("fill", "#4a6fa5")
            .text(`${totalProjects}\nProjects`);
        
        
        const rightX = 500;
        const rightY = 50;
        
        
        svg.append("rect")
            .attr("x", rightX - 20)
            .attr("y", rightY - 20)
            .attr("width", 300)
            .attr("height", 400)
            .attr("fill", "#f8f9fa")
            .attr("rx", 12)
            .attr("ry", 12)
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);
        
        
        svg.append("text")
            .attr("x", rightX)
            .attr("y", rightY + 10)
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("fill", "#166088")
            .text("Project Status");
        
       
        let yPos = rightY + 60;
        const stats = validData.filter(d => d.label !== "No Data");
        
        stats.forEach((item) => {
            
            svg.append("rect")
                .attr("x", rightX)
                .attr("y", yPos - 12)
                .attr("width", 16)
                .attr("height", 16)
                .attr("fill", item.color)
                .attr("rx", 4)
                .attr("ry", 4);
            
           
            svg.append("text")
                .attr("x", rightX + 25)
                .attr("y", yPos)
                .style("font-size", "16px")
                .style("font-weight", "600")
                .style("fill", item.color)
                .text(item.label);
            
            
            svg.append("text")
                .attr("x", rightX + 150)
                .attr("y", yPos)
                .style("font-size", "18px")
                .style("font-weight", "bold")
                .style("fill", "#343a40")
                .style("text-anchor", "end")
                .text(item.value);
            
            
            const percentage = Math.round((item.value / totalProjects) * 100);
            svg.append("text")
                .attr("x", rightX + 220)
                .attr("y", yPos)
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .style("fill", item.color)
                .style("text-anchor", "end")
                .text(`${percentage}%`);
            
            yPos += 45;
        });
        
        
        const passedStat = stats.find(d => d.label === "Passed");
        if (passedStat) {
            const passedPercentage = Math.round((passedStat.value / totalProjects) * 100);
            const progressStat = stats.find(d => d.label === "In Progress");
            
            
            svg.append("text")
                .attr("x", rightX)
                .attr("y", yPos + 10)
                .style("font-size", "14px")
                .style("font-weight", "600")
                .style("fill", "#166088")
                .text("Overall Progress");
            
            yPos += 35;
            
            
            svg.append("rect")
                .attr("x", rightX)
                .attr("y", yPos)
                .attr("width", 220)
                .attr("height", 12)
                .attr("fill", "#e0e0e0")
                .attr("rx", 6)
                .attr("ry", 6);
            
            
            const passedWidth = (passedStat.value / totalProjects) * 220;
            svg.append("rect")
                .attr("x", rightX)
                .attr("y", yPos)
                .attr("width", passedWidth)
                .attr("height", 12)
                .attr("fill", "#28a745")
                .attr("rx", 6)
                .attr("ry", 6);
            
            
            if (progressStat && progressStat.value > 0) {
                const progressWidth = (progressStat.value / totalProjects) * 220;
                svg.append("rect")
                    .attr("x", rightX + passedWidth)
                    .attr("y", yPos)
                    .attr("width", progressWidth)
                    .attr("height", 12)
                    .attr("fill", "#ffc107")
                    .attr("rx", 6)
                    .attr("ry", 6);
            }
            
            
            svg.append("text")
                .attr("x", rightX + 240)
                .attr("y", yPos + 10)
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .style("fill", "#28a745")
                .text(`${passedPercentage}%`);
            
            yPos += 35;
        }
        
        
        const passed = stats.find(d => d.label === "Passed")?.value || 0;
        const failed = stats.find(d => d.label === "Failed")?.value || 0;
        const progress = stats.find(d => d.label === "In Progress")?.value || 0;
        
        svg.append("text")
            .attr("x", rightX)
            .attr("y", yPos + 20)
            .style("font-size", "14px")
            .style("fill", "#6c757d")
            .text(`✓ Passed: ${passed}  |  🔄 In Progress: ${progress}  |  ✗ Failed: ${failed}`);
        
        console.log('Projects chart generated successfully!');
        
    } catch (error) {
        console.error('Error generating projects chart:', error);
        const svg = d3.select(svgElement);
        svg.selectAll("*").remove();
        svg.append("text")
            .attr("x", 400)
            .attr("y", 200)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#e74c3c")
            .text("Error generating chart");
    }
}

    // Generate spider/radar chart for skills
    generateSkillsChart(skills) {
        try {
            const svgElement = document.getElementById('skills-radar');
            const listContainer = document.getElementById('skills-list');
            
            if (!svgElement) return;

            // Clear previous content
            d3.select('#skills-radar').selectAll('*').remove();
            if (listContainer) listContainer.innerHTML = '';

            if (!skills || skills.length === 0) {
                if (listContainer) {
                    listContainer.innerHTML = '<p class="no-data">No skills data available</p>';
                }
                return;
            }

            console.log('generateSkillsChart - received skills:', skills);

            // Sort skills by amount (highest first) and take top skills for radar
            const sortedSkills = [...skills].sort((a, b) => (b.amount || 0) - (a.amount || 0));
            const skillsToDisplay = sortedSkills.slice(0, 8); // Limit to 8 for readability

            // Radar chart dimensions
            const width = 400;
            const height = 400;
            const margin = 60;
            const radius = Math.min(width, height) / 2 - margin;
            const centerX = width / 2;
            const centerY = height / 2;
            const levels = 5; // Number of concentric circles

            // Prepare data - fixed max of 100
            const maxValue = 100;
            const angleSlice = (Math.PI * 2) / skillsToDisplay.length;

            // Create SVG
            const svg = d3.select('#skills-radar')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', `0 0 ${width} ${height}`);

            const g = svg.append('g')
                .attr('transform', `translate(${centerX}, ${centerY})`);

            // Draw concentric circles (levels)
            for (let level = 1; level <= levels; level++) {
                const levelRadius = (radius / levels) * level;
                g.append('circle')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', levelRadius)
                    .attr('fill', 'none')
                    .attr('stroke', 'rgba(0, 0, 0, 0.2)')
                    .attr('stroke-width', 1);

                // Level labels
                g.append('text')
                    .attr('x', 5)
                    .attr('y', -levelRadius + 4)
                    .attr('fill', '#000')
                    .attr('font-size', '10px')
                    .text(Math.round((maxValue / levels) * level));
            }

            // Draw axis lines and labels
            skillsToDisplay.forEach((skill, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                // Axis line
                g.append('line')
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', x)
                    .attr('y2', y)
                    .attr('stroke', 'rgba(0, 0, 0, 0.3)')
                    .attr('stroke-width', 1);

                // Skill label
                const skillName = skill.object?.name || skill.type.replace('skill_', '').toUpperCase() || 'Unknown';
                const labelX = Math.cos(angle) * (radius + 25);
                const labelY = Math.sin(angle) * (radius + 25);

                g.append('text')
                    .attr('x', labelX)
                    .attr('y', labelY)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('fill', '#000')
                    .attr('font-size', '11px')
                    .attr('font-weight', 'bold')
                    .text(skillName);
            });

            // Create radar polygon path
            const radarLine = d3.lineRadial()
                .radius(d => (d.amount / maxValue) * radius)
                .angle((d, i) => i * angleSlice)
                .curve(d3.curveLinearClosed);

            // Draw radar area
            g.append('path')
                .datum(skillsToDisplay)
                .attr('d', radarLine)
                .attr('fill', 'rgba(79, 195, 161, 0.3)')
                .attr('stroke', '#4fc3a1')
                .attr('stroke-width', 2);

            // Draw data points
            skillsToDisplay.forEach((skill, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                const r = (skill.amount / maxValue) * radius;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;

                g.append('circle')
                    .attr('cx', x)
                    .attr('cy', y)
                    .attr('r', 5)
                    .attr('fill', '#4fc3a1')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event) {
                        d3.select(this).attr('r', 8);
                        const skillName = skill.object?.name || skill.type.replace('skill_', '').toUpperCase();
                        // Show tooltip
                        g.append('text')
                            .attr('class', 'skill-tooltip')
                            .attr('x', x)
                            .attr('y', y - 15)
                            .attr('text-anchor', 'middle')
                            .attr('fill', '#000')
                            .attr('font-size', '12px')
                            .attr('font-weight', 'bold')
                            .text(`${skillName}: ${skill.amount}`);
                    })
                    .on('mouseout', function() {
                        d3.select(this).attr('r', 5);
                        g.selectAll('.skill-tooltip').remove();
                    });
            });

            // Add legend/list below
            if (listContainer && sortedSkills.length > 8) {
                const remainingSkills = sortedSkills.slice(8);
                const legendTitle = document.createElement('p');
                legendTitle.style.cssText = 'color: #000; margin-top: 10px; font-size: 12px;';
                legendTitle.textContent = `+ ${remainingSkills.length} more skills`;
                listContainer.appendChild(legendTitle);
            }

        } catch (error) {
            console.error('Error generating skills radar chart:', error);
            const listContainer = document.getElementById('skills-list');
            if (listContainer) {
                listContainer.innerHTML = '<p class="error-message">Error loading skills chart</p>';
            }
        }
    }
}

const charts = new ChartGenerator();