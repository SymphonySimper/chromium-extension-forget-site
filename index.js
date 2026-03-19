const ATTRIBUTE_KEY = "data-key";

const root = document.body.querySelector("#root");
let historyMap = null;

root.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;

  const key = row.getAttribute(ATTRIBUTE_KEY);
  const values = historyMap?.get(key);
  if (!values) return;

  const promises = [];
  for (const { url } of values) {
    promises.push(chrome.history.deleteUrl({ url }));
  }

  Promise.all(promises).then(() => {
    alert(`${key} forgotten!`);
    row.remove();
  });
});

// refer: https://developer.chrome.com/docs/extensions/reference/api/history
chrome.history
  .search({
    text: "",
    maxResults: 100_000_000,
    startTime: 0,
  })
  .then((history) => {
    historyMap = new Map(
      [
        ...Map.groupBy(history, ({ url }) => {
          const { host, origin } = new URL(url);

          return host.length > 0 ? host : origin;
        }),
      ].sort(([, a], [, b]) => {
        return b.length - a.length;
      }),
    );

    const rows = [];
    for (const [key, value] of historyMap) {
      const tr = document.createElement("tr");
      tr.setAttribute(ATTRIBUTE_KEY, key);

      const td1 = document.createElement("td");
      td1.innerText = key;

      const td2 = document.createElement("td");
      td2.innerText = value.length;

      tr.append(td1, td2);
      rows.push(tr);
    }

    root.innerHTML = "";
    root.append(...rows);
  });
