function getColorFromRange(val, min, max, colors) {
    const ratio = Math.min(Math.max((val - min) / (max - min), 0), 1) * (colors.length - 1);
    const i = Math.floor(ratio);
    const t = ratio - i;

    const c1 = colors[i];
    const c2 = colors[Math.min(i + 1, colors.length - 1)];

    function hex2rgb(hex) {
        hex = hex.replace("#", "");
        return [
            parseInt(hex.substring(0, 2), 16),
            parseInt(hex.substring(2, 4), 16),
            parseInt(hex.substring(4, 6), 16)
        ];
    }

    const [r1, g1, b1] = hex2rgb(c1);
    const [r2, g2, b2] = hex2rgb(c2);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r},${g},${b})`;
}

function updateIcons() {
    const tempVal  = parseFloat(document.getElementById("temp").innerText);
    const humidVal = parseFloat(document.getElementById("humid").innerText);
    const lightVal = parseFloat(document.getElementById("light").innerText);

    const tempIcon  = document.querySelector(".bi-thermometer");
    const humidIcon = document.querySelector(".bi-droplet");
    const lightIcon = document.querySelector(".bi-brightness-high-fill");

    // Nhiệt độ: xanh → vàng → đỏ (giữ như cũ)
    const tempColor = getColorFromRange(tempVal, 0, 50, ["#0000ff", "#ffff00", "#ff0000"]);
    tempIcon.style.background = tempColor;

    // Độ ẩm: nâu → xanh da trời → xanh biển
    const humidColor = getColorFromRange(humidVal, 0, 100, ["#8b4513", "#87ceeb", "#00008b"]);
    humidIcon.style.background = humidColor;

    // Ánh sáng: xám → vàng nhạt → cam
    const lightColor = getColorFromRange(lightVal, 0, 2000, ["#808080", "#ffff99", "#ff8c00"]);
    lightIcon.style.background = lightColor;

    // áp dụng gradient text
    [tempIcon, humidIcon, lightIcon].forEach(icon => {
        icon.style.webkitBackgroundClip = "text";
        icon.style.backgroundClip = "text";
        icon.style.color = "transparent";
    });
}

// Theo dõi thay đổi giá trị
["temp", "humid", "light"].forEach(id => {
    const target = document.getElementById(id);
    const observer = new MutationObserver(updateIcons);
    observer.observe(target, { childList: true, characterData: true, subtree: true });
});

updateIcons();
