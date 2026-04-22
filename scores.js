const yAxisTicks = [990, 792, 594, 396, 198, 0];
const CHART_ITEM_COUNT = 5;

function parseCsv(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((v) => v.trim());
    return lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
        });
        return row;
    });
}

async function loadScoreHistory() {
    const response = await fetch("toeic_scores.csv");
    if (!response.ok) {
        throw new Error("CSV load failed");
    }

    const csvText = await response.text();
    const parsed = parseCsv(csvText);

    return parsed.map((item) => ({
        date: item.testDate || "",
        lc: Number(item.lc) || 0,
        rc: Number(item.rc) || 0
    }));
}

function renderScoreSummary(history) {
    if (!history.length) return;

    const latest = history[0];
    const latestTotal = latest.lc + latest.rc;
    const bestTotal = Math.max(...history.map((item) => item.lc + item.rc));

    document.getElementById("latest-lc").textContent = latest.lc;
    document.getElementById("latest-rc").textContent = latest.rc;
    document.getElementById("latest-total").textContent = latestTotal;
    document.getElementById("best-total").textContent = `${bestTotal}점`;
}

function renderScoreTrendChart(history) {
    const container = document.getElementById("chart-container");
    if (!container || !history.length) return;

    const width = 1120;
    const height = 370;
    const chartLeft = 85;
    const chartRight = 1085;
    const chartTop = 20;
    const chartBottom = 340;
    const maxScore = yAxisTicks[0];
    const xStart = 190;
    const xStep = 200;

    const toY = (score) => chartBottom - (score / maxScore) * (chartBottom - chartTop);
    const points = history.map((item, index) => {
        const total = item.lc + item.rc;
        const x = xStart + index * xStep;
        const y = toY(total);
        return { ...item, total, x, y };
    });

    const gridLines = yAxisTicks
        .map((tick, index) => {
            const y = chartTop + index * ((chartBottom - chartTop) / (yAxisTicks.length - 1));
            const stroke = index === yAxisTicks.length - 1 ? "#c9c9c9" : "#ececec";
            return `<line x1="${chartLeft}" y1="${y}" x2="${chartRight}" y2="${y}" stroke="${stroke}" stroke-width="2" />`;
        })
        .join("");

    const yLabels = yAxisTicks
        .map((tick, index) => {
            const y = chartTop + index * ((chartBottom - chartTop) / (yAxisTicks.length - 1)) + 4;
            return `<text class="y-axis-label" x="52" y="${y}" text-anchor="end">${tick}</text>`;
        })
        .join("");

    const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
    const circles = points
        .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="5.5" fill="#2f73bf" />`)
        .join("");

    const scoreLabels = points
        .map((point) => `<text class="point-score-label" x="${point.x}" y="${point.y + 42}" text-anchor="middle">${point.total}</text>`)
        .join("");

    const detailLabels = points
        .map((point) => `<text class="point-detail-label" x="${point.x}" y="${point.y + 66}" text-anchor="middle">LC ${point.lc} / RC ${point.rc}</text>`)
        .join("");

    const xLabels = points
        .map((point) => `<text class="x-axis-label" x="${point.x}" y="362" text-anchor="middle">${point.date}</text>`)
        .join("");

    container.innerHTML = `
        <svg class="graph-svg" viewBox="0 0 ${width} ${height}" aria-label="최근 5회차 시험 성적 추이">
            ${gridLines}
            ${yLabels}
            <polyline fill="none" stroke="#2f73bf" stroke-width="3.5" points="${polylinePoints}" />
            ${circles}
            ${scoreLabels}
            ${detailLabels}
            ${xLabels}
        </svg>
    `;
}

async function initializeScores() {
    try {
        const allScores = await loadScoreHistory();
        if (!allScores.length) return;

        const selectedDate = new URLSearchParams(window.location.search).get("date");
        const selectedScore = allScores.find((item) => item.date === selectedDate) || allScores[0];
        const chartScores = allScores.slice(0, CHART_ITEM_COUNT);

        renderScoreSummary([selectedScore, ...allScores]);
        renderScoreTrendChart(chartScores);
    } catch (error) {
        console.error("점수 파일 로드 실패:", error);
    }
}

initializeScores();
