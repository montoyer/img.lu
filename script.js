const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const grid = document.getElementById('grid');
const navStats = document.getElementById('nav-stats');
const resultsHeader = document.getElementById('results-header');
const zipBtn = document.getElementById('download-all');
const themeBtn = document.getElementById('theme-toggle');

let totalSavedBytes = 0;
let fileList = [];

// 1. Seamless Interactions
dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFiles(e.target.files);

dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.boxShadow = "0 0 40px var(--accent-glow)"; };
dropZone.ondragleave = () => { dropZone.style.boxShadow = "none"; };
dropZone.ondrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

// 2. Core Engine
async function handleFiles(files) {
    if (files.length > 0) resultsHeader.style.display = 'flex';
    
    for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        await compressAndRender(file);
    }
}

const ghostStat = document.getElementById('bg-stat-ghost');

async function compressAndRender(file) {
    const originalSize = file.size;
    const originalUrl = URL.createObjectURL(file);
    
    const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: document.getElementById('resize-check').checked ? 1600 : 4000,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: parseFloat(document.getElementById('quality-lvl').value)
    };

    try {
        const compressed = await imageCompression(file, options);
        const compUrl = URL.createObjectURL(compressed);
        const reduction = Math.round(((originalSize - compressed.size) / originalSize) * 100);
        
        // Stats Calculation
        totalSavedBytes += (originalSize - compressed.size);
        const savedMB = totalSavedBytes / (1024 * 1024);
        
        // UPDATE UI
        navStats.innerText = `${savedMB.toFixed(2)} MB saved`;
        
        // GHOST TYPOGRAPHY LOGIC
        // Every MB saved increases the opacity and size slightly
        const ghostOpacity = Math.min(0.02 + (savedMB * 0.01), 0.12); // Max 12% opacity
        const ghostScale = 1 + (savedMB * 0.02); // Grows 2% per MB
        
        ghostStat.innerText = Math.floor(savedMB);
        ghostStat.style.opacity = ghostOpacity;
        ghostStat.style.transform = `translate(-50%, -50%) scale(${ghostScale})`;

        // Render Card (keep your previous createCard function)
        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        fileList.push({ name: newName, blob: compressed });
        createCard(newName, compUrl, originalUrl, compressed.size, reduction);
        
    } catch (e) { console.error(e); }
}

function createCard(name, compUrl, origUrl, size, reduction) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="img-box">
            <img src="${compUrl}" class="img-comp">
            <img src="${origUrl}" class="img-orig">
            <div class="status-pill"></div>
        </div>
        <div class="card-footer">
            <div>
                <div style="font-size: 13px; font-weight: 600; overflow:hidden; width: 120px; white-space:nowrap; text-overflow:ellipsis;">${name}</div>
                <div style="font-size: 11px; color: var(--text-dim);">${(size/1024).toFixed(1)} KB</div>
            </div>
            <div class="reduction">-${reduction}%</div>
        </div>
        <a href="${compUrl}" download="${name}" class="btn-primary" style="display:block; text-align:center; margin-top:15px; text-decoration:none;">Download</a>
    `;
    grid.prepend(card);
}

// 3. Theme Management
themeBtn.onclick = () => {
    const theme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
};

// 4. Bulk Zip
zipBtn.onclick = () => {
    const zip = new JSZip();
    fileList.forEach(f => zip.file(f.name, f.blob));
    zip.generateAsync({type:"blob"}).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "img_lu_v3_pack.zip";
        link.click();
    });
};