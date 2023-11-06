/* global browser */
/* eslint-disable no-useless-escape */

(function () {
  if (typeof window.tbl2csv_hasRun !== "undefined") {
    return;
  }
  window.tbl2csv_hasRun = true;

  let tableStyleSheet = document.createElement("style");
  document.head.appendChild(tableStyleSheet);
  const highlightCSS = `.divTbl, ol, ul, table { border: 3px dotted red !important; padding:1px !important; margin:1px !important; }`;
  tableStyleSheet.sheet.insertRule(highlightCSS, 0);
  tableStyleSheet.disabled = true;

  // export type (text,html)
  let mode = "text";
  const seperator = ",";
  const CRLF = "\r\n";

  // add empty data link
  let link = document.createElement("a");
  link.style.display = "none";
  link.setAttribute("target", "_blank");
  link.setAttribute(
    "download",
    encodeURIComponent(document.location.href) + ".csv"
  );
  document.body.append(link);

  // consts
  const re_quote = new RegExp('"', "gm");
  const re_break = new RegExp(/(\r\n|\n|\r)/, "gm");
  const re_space = new RegExp(/\s+/, "gm");
  const tblrowdsps = ["table-row", "table-header-group", "table-footer-group"];

  const convert = {
    div: div2csv,
    table: table2csv,
    ul: list2csv,
    ol: list2csv,
  };

  function getDataFromNode(node) {
    let data = mode.endsWith("html") ? node.innerHTML : node.innerText;
    return data
      .replace(re_break, " ")
      .replace(re_space, " ")
      .trim()
      .replace(re_quote, '""');
  }

  function div2csv(tbl) {
    let csv = [];
    tbl.querySelectorAll("div").forEach((tr) => {
      if (tblrowdsps.includes(getStyle(tr, "display"))) {
        let row = [];
        tr.querySelectorAll("div").forEach((td) => {
          if (getStyle(td, "display") === "table-cell") {
            const data = getDataFromNode(td);
            row.push('"' + data + '"');
          }
        });
        if (row.length > 0) {
          csv.push(row.join(seperator));
        }
      }
    });
    return csv.join(CRLF);
  }

  function table2csv(tbl) {
    let csv = [];
    tbl.querySelectorAll("tr").forEach((tr) => {
      // skip rows in subtables
      if (!tbl.isSameNode(tr.closest("table"))) {
        return;
      }
      let row = [];
      tr.querySelectorAll("td, th").forEach((td) => {
        const data = getDataFromNode(td);
        row.push('"' + data + '"');
        // add colspan padding
        for (let i = 1, n = td.getAttribute("colspan"); i < n; i++) {
          row.push('""');
        }
      });
      // skip rows without cells
      if (row.length > 0) {
        csv.push(row.join(seperator));
      }
    });
    return csv.join(CRLF);
  }

  function list2csv(ul) {
    let csv = [];
    ul.querySelectorAll("li").forEach((li) => {
      const data = getDataFromNode(li);
      csv.push('"' + data + '"');
    });
    return csv.join(CRLF);
  }

  function getClosestExportableParent(node) {
    while (
      node !== null &&
      typeof node.tagName === "string" &&
      node.tagName.toLowerCase() !== "table" &&
      node.tagName.toLowerCase() !== "ol" &&
      node.tagName.toLowerCase() !== "ul"
    ) {
      if (
        node.tagName.toLowerCase() === "div" &&
        getStyle(node, "display") === "table"
      ) {
        break;
      }
      node = node.parentNode;
    }
    return node;
  }

  function simulateClick(elem) {
    const evt = new MouseEvent("click", {
      bubbles: false,
      cancelable: false,
      view: window,
    });
    elem.dispatchEvent(evt);
  }

  function highlightDivTables() {
    document.querySelectorAll("div").forEach((div) => {
      if (getStyle(div, "display") === "table") {
        if (!hasClass(div, "divTbl")) {
          addClass(div, "divTbl");
        }
      }
    });
  }

  function getStyle(node, attr) {
    return window.getComputedStyle(node, null)[attr];
  }

  function hasClass(ele, cls) {
    return !!ele.className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"));
  }

  function addClass(ele, cls) {
    ele.className += " " + cls;
  }

  // register message listener

  let doOnce = true;

  browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === "highlight") {
      if (tableStyleSheet.disabled) {
        if (doOnce) {
          // add classes on first click
          doOnce = false;
          highlightDivTables();
        }
        tableStyleSheet.disabled = false; // toggle stylesheet
      } else {
        tableStyleSheet.disabled = true; // togglestylesheet
      }
    }

    if (message.action === "export") {
      mode = message.mode;

      const clickTarget = browser.menus.getTargetElement(
        message.targetElementId
      );
      const exportableTarget = getClosestExportableParent(clickTarget);
      if (exportableTarget === null) {
        alert(
          "No exportable target found!\nHint: Click the toolbar icon to highlight exportable targets"
        );
        return;
      }
      const str =
        convert[exportableTarget.tagName.toLowerCase()](exportableTarget);

      if (mode.startsWith("export")) {
        link.setAttribute(
          "href",
          "data:text/csv;charset=utf-8," + encodeURIComponent(str)
        );
        /*
        link.href = window.URL.createObjectURL(new Blob([str], {
            type: "text/csv"
        }));
        */
        simulateClick(link);
      } else {
        navigator.clipboard.writeText(str);
      }
    }
  });
})();
