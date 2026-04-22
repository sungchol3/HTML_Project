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

function buildScoreRow(item) {
    return `
        <tr>
            <td class="date-cell">${item.testDate}</td>
            <td class="result-cell">
                <p class="total">Total ${item.total} <span>(LC ${item.lc}, RC ${item.rc})</span></p>
                <p class="number">수험번호 : ${item.registrationNo}</p>
            </td>
        </tr>
    `;
}

function bindDetailButtons(tableBody) {
    const detailPage = tableBody.dataset.detailPage || "toeic.html";

    tableBody.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const button = target.closest(".btn-detail");
        if (!button) return;

        const testDate = button.getAttribute("data-test-date");
        if (!testDate) return;

        window.location.href = `${detailPage}?date=${encodeURIComponent(testDate)}`;
    });
}

async function renderScoresFromCsv() {
    const tableBody = document.getElementById("score-data");
    if (!tableBody) return;

    bindDetailButtons(tableBody);

    try {
        const response = await fetch("toeic_scores.csv");
        if (!response.ok) throw new Error("CSV load failed");

        const csvText = await response.text();
        const rows = parseCsv(csvText);
        tableBody.innerHTML = rows.map(buildScoreRow).join("");
    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">점수 파일을 불러오지 못했습니다.</td>
            </tr>
        `;
    }
}

renderScoresFromCsv();
