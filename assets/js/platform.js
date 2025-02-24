function loadModule(moduleNumber) {
    fetch(`json/module${moduleNumber}.json`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("module-title").innerText = data.module;
            document.getElementById("module-description").innerText = data.description;

            const activityContainer = document.getElementById("activity-grid");
            activityContainer.innerHTML = "";

            data.activities.forEach(activity => {
                let activityCard = `
                    <div class="activity-card">
                        <h3>${activity.title}</h3>
                        <p>${activity.description}</p>
                        <button class="activity-button" onclick="loadActivity(${moduleNumber}, '${activity.id}')">
                            Responder
                        </button>
                    </div>
                `;
                activityContainer.innerHTML += activityCard;
            });
        })
        .catch(error => console.error("Error loading module:", error));
}

function loadActivity(moduleNumber, activityId) {
    window.location.href = `activity.html?module=${moduleNumber}&activity=${activityId}`;
}
