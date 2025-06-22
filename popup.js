document.getElementById("addSite").addEventListener("click", () => {
  const input = document.getElementById("siteInput").value.trim();
  if (input) {
    chrome.storage.local.get({ blockedSites: [] }, ({ blockedSites }) => {
      const updatedList = [...new Set([...blockedSites, input])];
      chrome.storage.local.set({ blockedSites: updatedList }, () => {
        document.getElementById("siteInput").value = "";
        refreshList();
      });
    });
  }
});

function refreshList() {
  chrome.storage.local.get({ blockedSites: [], protectedSites: [] }, ({ blockedSites, protectedSites }) => {
    const list = document.getElementById("siteList");
    list.innerHTML = "";
    blockedSites.forEach(site => {
      const li = document.createElement("li");
      li.textContent = site;
      if (!protectedSites.includes(site)) {
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "❌";
        removeBtn.onclick = () => {
          const filtered = blockedSites.filter(s => s !== site);
          chrome.storage.local.set({ blockedSites: filtered }, refreshList);
        };
        li.appendChild(removeBtn);
      } else {
        const lock = document.createElement("span");
        lock.textContent = " 🔒";
        li.appendChild(lock);
      }
      list.appendChild(li);
    });
  });
}

document.addEventListener("DOMContentLoaded", refreshList);